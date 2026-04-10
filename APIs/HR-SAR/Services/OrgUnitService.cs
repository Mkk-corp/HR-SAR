using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class OrgUnitService(AppDbContext db) : IOrgUnitService
{
    public async Task<IEnumerable<OrgUnitDto>> GetAllAsync(string? search, string? type, string? status)
    {
        var query = db.OrganizationUnits
            .Include(u => u.Parent)
            .Include(u => u.Positions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u => u.NameAr.ToLower().Contains(s) || u.NameEn.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(u => u.Type == type);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(u => u.Status == status);

        var list = await query.OrderBy(u => u.Type).ThenBy(u => u.NameAr).ToListAsync();
        return list.Select(u => ToDto(u));
    }

    public async Task<OrgUnitDto> GetTreeAsync()
    {
        var all = await db.OrganizationUnits
            .Include(u => u.Positions)
            .OrderBy(u => u.NameAr)
            .ToListAsync();

        var roots = all.Where(u => u.ParentId == null).ToList();
        var rootDto = new OrgUnitDto { NameAr = "الهيكل التنظيمي", NameEn = "Org Structure", Type = "Root" };
        rootDto.Children = roots.Select(r => BuildTree(r, all)).ToList();
        return rootDto;
    }

    public async Task<OrgUnitDto?> GetByIdAsync(Guid id)
    {
        var u = await db.OrganizationUnits
            .Include(x => x.Parent)
            .Include(x => x.Positions)
            .FirstOrDefaultAsync(x => x.Id == id);
        return u is null ? null : ToDto(u);
    }

    public async Task<OrgUnitDto> CreateAsync(CreateOrgUnitDto dto)
    {
        // Validate parent type hierarchy
        if (dto.ParentId.HasValue)
        {
            var parent = await db.OrganizationUnits.FindAsync(dto.ParentId);
            if (parent is null) throw new InvalidOperationException("الوحدة الأم غير موجودة");
            ValidateTypeHierarchy(parent.Type, dto.Type);
        }

        var unit = new OrganizationUnit
        {
            NameAr   = dto.NameAr,
            NameEn   = dto.NameEn,
            Type     = dto.Type,
            ParentId = dto.ParentId,
            Status   = dto.Status,
        };

        db.OrganizationUnits.Add(unit);
        await db.SaveChangesAsync();

        if (unit.ParentId.HasValue)
            await db.Entry(unit).Reference(u => u.Parent).LoadAsync();

        return ToDto(unit);
    }

    public async Task<OrgUnitDto?> UpdateAsync(Guid id, UpdateOrgUnitDto dto)
    {
        var unit = await db.OrganizationUnits
            .Include(u => u.Parent)
            .Include(u => u.Positions)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (unit is null) return null;

        if (dto.NameAr is not null) unit.NameAr = dto.NameAr;
        if (dto.NameEn is not null) unit.NameEn = dto.NameEn;
        if (dto.Type is not null)   unit.Type   = dto.Type;
        if (dto.Status is not null) unit.Status = dto.Status;
        if (dto.ParentId.HasValue)
        {
            // Prevent circular reference
            if (dto.ParentId == id) throw new InvalidOperationException("لا يمكن أن تكون الوحدة أبًا لنفسها");
            unit.ParentId = dto.ParentId;
        }

        await db.SaveChangesAsync();
        return ToDto(unit);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var unit = await db.OrganizationUnits
            .Include(u => u.Children)
            .Include(u => u.Positions)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (unit is null) return false;

        if (unit.Children.Any())
            throw new InvalidOperationException("لا يمكن حذف وحدة تنظيمية تحتوي على وحدات فرعية");
        if (unit.Positions.Any())
            throw new InvalidOperationException("لا يمكن حذف وحدة تنظيمية تحتوي على مناصب. أرشفها أو احذف المناصب أولاً");

        db.OrganizationUnits.Remove(unit);
        await db.SaveChangesAsync();
        return true;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static readonly string[] TypeOrder = ["Division", "Department", "Section", "Unit"];

    private static void ValidateTypeHierarchy(string parentType, string childType)
    {
        var parentIdx = Array.IndexOf(TypeOrder, parentType);
        var childIdx  = Array.IndexOf(TypeOrder, childType);
        if (parentIdx < 0 || childIdx < 0) return; // unknown types — skip validation
        if (childIdx <= parentIdx)
            throw new InvalidOperationException($"النوع '{childType}' لا يمكن أن يكون تحت '{parentType}'");
    }

    private static OrgUnitDto BuildTree(OrganizationUnit unit, List<OrganizationUnit> all)
    {
        var dto = ToDto(unit);
        dto.Children = all
            .Where(u => u.ParentId == unit.Id)
            .Select(child => BuildTree(child, all))
            .ToList();
        return dto;
    }

    private static OrgUnitDto ToDto(OrganizationUnit u) => new()
    {
        Id            = u.Id,
        NameAr        = u.NameAr,
        NameEn        = u.NameEn,
        Type          = u.Type,
        ParentId      = u.ParentId,
        ParentNameAr  = u.Parent?.NameAr,
        Status        = u.Status,
        PositionCount = u.Positions?.Count ?? 0,
        CreatedAt     = u.CreatedAt,
    };
}

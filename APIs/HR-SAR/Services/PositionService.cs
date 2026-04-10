using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class PositionService(AppDbContext db) : IPositionService
{
    public async Task<IEnumerable<PositionDto>> GetAllAsync(Guid? orgUnitId, Guid? jobTitleId, string? status)
    {
        var query = db.Positions
            .Include(p => p.JobTitle)
            .Include(p => p.OrgUnit)
            .Include(p => p.ManagerPosition).ThenInclude(mp => mp!.JobTitle)
            .Include(p => p.EmployeePositions)
            .AsQueryable();

        if (orgUnitId.HasValue)  query = query.Where(p => p.OrgUnitId == orgUnitId);
        if (jobTitleId.HasValue) query = query.Where(p => p.JobTitleId == jobTitleId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(p => p.Status == status);

        var list = await query.OrderBy(p => p.OrgUnit.NameAr).ThenBy(p => p.JobTitle.NameAr).ToListAsync();
        return list.Select(ToDto);
    }

    public async Task<PositionDto?> GetByIdAsync(Guid id)
    {
        var p = await db.Positions
            .Include(x => x.JobTitle)
            .Include(x => x.OrgUnit)
            .Include(x => x.ManagerPosition).ThenInclude(mp => mp!.JobTitle)
            .Include(x => x.EmployeePositions)
            .FirstOrDefaultAsync(x => x.Id == id);
        return p is null ? null : ToDto(p);
    }

    public async Task<PositionDto> CreateAsync(CreatePositionDto dto)
    {
        if (!await db.JobTitles.AnyAsync(j => j.Id == dto.JobTitleId))
            throw new InvalidOperationException("المسمى الوظيفي غير موجود");
        if (!await db.OrganizationUnits.AnyAsync(u => u.Id == dto.OrgUnitId))
            throw new InvalidOperationException("الوحدة التنظيمية غير موجودة");

        var position = new Position
        {
            JobTitleId         = dto.JobTitleId,
            OrgUnitId          = dto.OrgUnitId,
            ManagerPositionId  = dto.ManagerPositionId,
            Headcount          = dto.Headcount,
            Status             = dto.Status,
        };

        db.Positions.Add(position);
        await db.SaveChangesAsync();

        await db.Entry(position).Reference(p => p.JobTitle).LoadAsync();
        await db.Entry(position).Reference(p => p.OrgUnit).LoadAsync();

        return ToDto(position);
    }

    public async Task<PositionDto?> UpdateAsync(Guid id, UpdatePositionDto dto)
    {
        var position = await db.Positions
            .Include(p => p.JobTitle)
            .Include(p => p.OrgUnit)
            .Include(p => p.ManagerPosition).ThenInclude(mp => mp!.JobTitle)
            .Include(p => p.EmployeePositions)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (position is null) return null;

        // Validate headcount ≥ current filled count
        if (dto.Headcount.HasValue)
        {
            var filled = position.EmployeePositions.Count(ep => ep.EndDate == null);
            if (dto.Headcount.Value < filled)
                throw new InvalidOperationException($"لا يمكن تقليل الطاقة الاستيعابية إلى {dto.Headcount} — عدد الموظفين الحاليين {filled}");
            position.Headcount = dto.Headcount.Value;
        }

        if (dto.JobTitleId.HasValue)        position.JobTitleId        = dto.JobTitleId.Value;
        if (dto.OrgUnitId.HasValue)         position.OrgUnitId         = dto.OrgUnitId.Value;
        if (dto.ManagerPositionId.HasValue) position.ManagerPositionId = dto.ManagerPositionId.Value;
        if (dto.Status is not null)         position.Status            = dto.Status;

        await db.SaveChangesAsync();
        return ToDto(position);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var position = await db.Positions
            .Include(p => p.EmployeePositions)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (position is null) return false;

        if (position.EmployeePositions.Any(ep => ep.EndDate == null))
            throw new InvalidOperationException("لا يمكن حذف منصب يحتوي على موظفين نشطين");

        db.Positions.Remove(position);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<EmployeePositionDto> AssignEmployeeAsync(AssignEmployeeDto dto)
    {
        var position = await db.Positions
            .Include(p => p.EmployeePositions)
            .Include(p => p.JobTitle)
            .FirstOrDefaultAsync(p => p.Id == dto.PositionId)
            ?? throw new InvalidOperationException("المنصب غير موجود");

        // Check headcount
        var filled = position.EmployeePositions.Count(ep => ep.EndDate == null);
        if (filled >= position.Headcount)
            throw new InvalidOperationException($"المنصب ممتلئ (الطاقة: {position.Headcount})");

        // Check employee has no other active position
        var hasActive = await db.EmployeePositions
            .AnyAsync(ep => ep.EmployeeId == dto.EmployeeId && ep.EndDate == null);
        if (hasActive)
            throw new InvalidOperationException("الموظف لديه منصب نشط بالفعل. استخدم النقل بدلاً من التعيين");

        var emp = await db.Employees.FindAsync(dto.EmployeeId)
            ?? throw new InvalidOperationException("الموظف غير موجود");

        var ep = new EmployeePosition
        {
            EmployeeId = dto.EmployeeId,
            PositionId = dto.PositionId,
            StartDate  = dto.StartDate,
        };

        db.EmployeePositions.Add(ep);
        await db.SaveChangesAsync();

        return new EmployeePositionDto
        {
            EmployeeId   = emp.Id,
            EmployeeName = emp.Name,
            EmployeeCode = emp.Code,
            PositionId   = dto.PositionId,
            StartDate    = ep.StartDate,
        };
    }

    public async Task<EmployeePositionDto> TransferEmployeeAsync(TransferEmployeeDto dto)
    {
        // Close current assignment
        var current = await db.EmployeePositions
            .FirstOrDefaultAsync(ep => ep.EmployeeId == dto.EmployeeId
                                    && ep.PositionId == dto.FromPositionId
                                    && ep.EndDate == null)
            ?? throw new InvalidOperationException("لم يتم العثور على تعيين نشط للموظف في المنصب المحدد");

        current.EndDate = dto.EffectiveDate;

        // Assign to new position
        var assignDto = new AssignEmployeeDto(dto.EmployeeId, dto.ToPositionId, dto.EffectiveDate);
        db.EmployeePositions.Update(current);
        await db.SaveChangesAsync();

        return await AssignEmployeeAsync(assignDto);
    }

    public async Task<IEnumerable<EmployeePositionDto>> GetPositionEmployeesAsync(Guid positionId)
    {
        var list = await db.EmployeePositions
            .Include(ep => ep.Employee)
            .Where(ep => ep.PositionId == positionId)
            .OrderByDescending(ep => ep.StartDate)
            .ToListAsync();

        return list.Select(ep => new EmployeePositionDto
        {
            EmployeeId   = ep.EmployeeId,
            EmployeeName = ep.Employee.Name,
            EmployeeCode = ep.Employee.Code,
            PositionId   = ep.PositionId,
            StartDate    = ep.StartDate,
            EndDate      = ep.EndDate,
        });
    }

    private static PositionDto ToDto(Position p) => new()
    {
        Id                     = p.Id,
        JobTitleId             = p.JobTitleId,
        JobTitleNameAr         = p.JobTitle?.NameAr ?? string.Empty,
        JobTitleCode           = p.JobTitle?.Code ?? string.Empty,
        OrgUnitId              = p.OrgUnitId,
        OrgUnitNameAr          = p.OrgUnit?.NameAr ?? string.Empty,
        ManagerPositionId      = p.ManagerPositionId,
        ManagerJobTitleNameAr  = p.ManagerPosition?.JobTitle?.NameAr,
        Headcount              = p.Headcount,
        FilledCount            = p.EmployeePositions?.Count(ep => ep.EndDate == null) ?? 0,
        Status                 = p.Status,
        CreatedAt              = p.CreatedAt,
    };
}

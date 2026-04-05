using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class FacilityService : IFacilityService
{
    private readonly AppDbContext _db;

    public FacilityService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<FacilityResponseDto>> GetAllAsync(string? search = null, string? type = null)
    {
        var query = _db.Facilities
            .Include(f => f.Parent)
            .Include(f => f.Employees)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(f =>
                f.Name.ToLower().Contains(s) ||
                f.CrNumber.ToLower().Contains(s) ||
                f.NationalNumber.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(f => f.Type == type);

        return await query
            .OrderBy(f => f.Name)
            .Select(f => ToDto(f))
            .ToListAsync();
    }

    public async Task<FacilityResponseDto?> GetByIdAsync(Guid id)
    {
        var f = await _db.Facilities
            .Include(x => x.Parent)
            .Include(x => x.Employees)
            .FirstOrDefaultAsync(x => x.Id == id);
        return f is null ? null : ToDto(f);
    }

    public async Task<FacilityResponseDto> CreateAsync(CreateFacilityDto dto)
    {
        var facility = new Facility
        {
            Name = dto.Name,
            Type = dto.Type,
            ParentId = dto.ParentId,
            NationalNumber = dto.NationalNumber,
            CrNumber = dto.CrNumber,
            CrDate = dto.CrDate,
            TaxNumber = dto.TaxNumber,
            InsuranceNumber = dto.InsuranceNumber,
            NationalAddress = dto.NationalAddress,
            WorkLocation = dto.WorkLocation,
            EconomicActivity = dto.EconomicActivity,
            Isic4 = dto.Isic4,
        };

        _db.Facilities.Add(facility);
        await _db.SaveChangesAsync();

        if (facility.ParentId.HasValue)
            await _db.Entry(facility).Reference(f => f.Parent).LoadAsync();

        return ToDto(facility);
    }

    public async Task<FacilityResponseDto?> UpdateAsync(Guid id, UpdateFacilityDto dto)
    {
        var facility = await _db.Facilities
            .Include(f => f.Parent)
            .Include(f => f.Employees)
            .FirstOrDefaultAsync(f => f.Id == id);
        if (facility is null) return null;

        if (dto.Name is not null) facility.Name = dto.Name;
        if (dto.Type is not null) facility.Type = dto.Type;
        if (dto.ParentId.HasValue) facility.ParentId = dto.ParentId;
        if (dto.NationalNumber is not null) facility.NationalNumber = dto.NationalNumber;
        if (dto.CrNumber is not null) facility.CrNumber = dto.CrNumber;
        if (dto.CrDate.HasValue) facility.CrDate = dto.CrDate;
        if (dto.TaxNumber is not null) facility.TaxNumber = dto.TaxNumber;
        if (dto.InsuranceNumber is not null) facility.InsuranceNumber = dto.InsuranceNumber;
        if (dto.NationalAddress is not null) facility.NationalAddress = dto.NationalAddress;
        if (dto.WorkLocation is not null) facility.WorkLocation = dto.WorkLocation;
        if (dto.EconomicActivity is not null) facility.EconomicActivity = dto.EconomicActivity;
        if (dto.Isic4 is not null) facility.Isic4 = dto.Isic4;

        await _db.SaveChangesAsync();
        return ToDto(facility);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var facility = await _db.Facilities.FindAsync(id);
        if (facility is null) return false;
        _db.Facilities.Remove(facility);
        await _db.SaveChangesAsync();
        return true;
    }

    private static FacilityResponseDto ToDto(Facility f) => new()
    {
        Id = f.Id,
        Type = f.Type,
        ParentId = f.ParentId,
        ParentName = f.Parent?.Name,
        Name = f.Name,
        NationalNumber = f.NationalNumber,
        CrNumber = f.CrNumber,
        CrDate = f.CrDate,
        TaxNumber = f.TaxNumber,
        InsuranceNumber = f.InsuranceNumber,
        NationalAddress = f.NationalAddress,
        WorkLocation = f.WorkLocation,
        EconomicActivity = f.EconomicActivity,
        Isic4 = f.Isic4,
        EmployeeCount = f.Employees.Count,
        SaudiCount = f.Employees.Count(e => e.EmpType == "سعودي"),
        CreatedAt = f.CreatedAt,
    };
}

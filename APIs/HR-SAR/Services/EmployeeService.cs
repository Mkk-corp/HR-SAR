using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _db;

    public EmployeeService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<EmployeeResponseDto>> GetAllAsync(string? search = null, Guid? facilityId = null, string? status = null)
    {
        var query = _db.Employees.Include(e => e.Facility).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(e =>
                e.Name.ToLower().Contains(s) ||
                e.Code.ToLower().Contains(s) ||
                e.Nationality.ToLower().Contains(s) ||
                (e.Facility != null && e.Facility.Name.ToLower().Contains(s)));
        }

        if (facilityId.HasValue)
            query = query.Where(e => e.FacilityId == facilityId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(e => e.Status == status);

        return await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => ToDto(e))
            .ToListAsync();
    }

    public async Task<EmployeeResponseDto?> GetByIdAsync(Guid id)
    {
        var e = await _db.Employees.Include(x => x.Facility).FirstOrDefaultAsync(x => x.Id == id);
        return e is null ? null : ToDto(e);
    }

    public async Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto)
    {
        var employee = new Employee
        {
            Name = dto.Name,
            Code = dto.Code,
            NationalId = dto.NationalId,
            IdNumber = dto.IdNumber,
            Nationality = dto.Nationality,
            EmpType = dto.EmpType,
            FacilityId = dto.FacilityId,
            Salary = dto.Salary,
            Status = dto.Status,
            Department = dto.Department,
            JobTitle = dto.JobTitle,
            Manager = dto.Manager,
            WorkLocation = dto.WorkLocation,
            Grade = dto.Grade,
            EntryDate = dto.EntryDate,
            IdExpiry = dto.IdExpiry,
            Bank = dto.Bank,
            Iban = dto.Iban,
            CountryCode = dto.CountryCode,
            Phone = dto.Phone,
            PhotoUrl = dto.PhotoUrl,
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();
        await _db.Entry(employee).Reference(e => e.Facility).LoadAsync();
        return ToDto(employee);
    }

    public async Task<EmployeeResponseDto?> UpdateAsync(Guid id, UpdateEmployeeDto dto)
    {
        var employee = await _db.Employees.Include(e => e.Facility).FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null) return null;

        if (dto.Name is not null) employee.Name = dto.Name;
        if (dto.Nationality is not null) employee.Nationality = dto.Nationality;
        if (dto.EmpType is not null) employee.EmpType = dto.EmpType;
        if (dto.FacilityId.HasValue) employee.FacilityId = dto.FacilityId;
        if (dto.Salary.HasValue) employee.Salary = dto.Salary.Value;
        if (dto.Status is not null) employee.Status = dto.Status;
        if (dto.Department is not null) employee.Department = dto.Department;
        if (dto.JobTitle is not null) employee.JobTitle = dto.JobTitle;
        if (dto.Manager is not null) employee.Manager = dto.Manager;
        if (dto.WorkLocation is not null) employee.WorkLocation = dto.WorkLocation;
        if (dto.Grade is not null) employee.Grade = dto.Grade;
        if (dto.EntryDate.HasValue) employee.EntryDate = dto.EntryDate;
        if (dto.IdExpiry.HasValue) employee.IdExpiry = dto.IdExpiry;
        if (dto.Bank is not null) employee.Bank = dto.Bank;
        if (dto.Iban is not null) employee.Iban = dto.Iban;
        if (dto.CountryCode is not null) employee.CountryCode = dto.CountryCode;
        if (dto.Phone is not null) employee.Phone = dto.Phone;
        if (dto.PhotoUrl is not null) employee.PhotoUrl = dto.PhotoUrl;

        await _db.SaveChangesAsync();
        await _db.Entry(employee).Reference(e => e.Facility).LoadAsync();
        return ToDto(employee);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee is null) return false;
        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CodeExistsAsync(string code, Guid? excludeId = null)
    {
        var query = _db.Employees.Where(e => e.Code == code);
        if (excludeId.HasValue) query = query.Where(e => e.Id != excludeId);
        return await query.AnyAsync();
    }

    private static EmployeeResponseDto ToDto(Employee e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Code = e.Code,
        NationalId = e.NationalId,
        IdNumber = e.IdNumber,
        Nationality = e.Nationality,
        EmpType = e.EmpType,
        FacilityId = e.FacilityId,
        FacilityName = e.Facility?.Name,
        Salary = e.Salary,
        Status = e.Status,
        Department = e.Department,
        JobTitle = e.JobTitle,
        Manager = e.Manager,
        WorkLocation = e.WorkLocation,
        Grade = e.Grade,
        EntryDate = e.EntryDate,
        IdExpiry = e.IdExpiry,
        Bank = e.Bank,
        Iban = e.Iban,
        CountryCode = e.CountryCode,
        Phone = e.Phone,
        PhotoUrl = e.PhotoUrl,
        CreatedAt = e.CreatedAt,
    };
}

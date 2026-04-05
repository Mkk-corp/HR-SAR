using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface IEmployeeService
{
    Task<IEnumerable<EmployeeResponseDto>> GetAllAsync(string? search = null, Guid? facilityId = null, string? status = null);
    Task<EmployeeResponseDto?> GetByIdAsync(Guid id);
    Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto);
    Task<EmployeeResponseDto?> UpdateAsync(Guid id, UpdateEmployeeDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> CodeExistsAsync(string code, Guid? excludeId = null);
}

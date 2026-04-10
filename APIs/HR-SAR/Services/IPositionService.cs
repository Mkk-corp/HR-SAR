using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface IPositionService
{
    Task<IEnumerable<PositionDto>> GetAllAsync(Guid? orgUnitId, Guid? jobTitleId, string? status);
    Task<PositionDto?> GetByIdAsync(Guid id);
    Task<PositionDto> CreateAsync(CreatePositionDto dto);
    Task<PositionDto?> UpdateAsync(Guid id, UpdatePositionDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<EmployeePositionDto> AssignEmployeeAsync(AssignEmployeeDto dto);
    Task<EmployeePositionDto> TransferEmployeeAsync(TransferEmployeeDto dto);
    Task<IEnumerable<EmployeePositionDto>> GetPositionEmployeesAsync(Guid positionId);
}

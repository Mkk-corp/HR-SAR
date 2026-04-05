using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface ITransferService
{
    Task<IEnumerable<TransferResponseDto>> GetAllAsync(string? status = null, string? type = null, Guid? employeeId = null);
    Task<TransferResponseDto?> GetByIdAsync(Guid id);
    Task<TransferResponseDto> CreateAsync(CreateTransferDto dto);
    Task<TransferResponseDto?> UpdateStatusAsync(Guid id, UpdateTransferStatusDto dto);
    Task<bool> DeleteAsync(Guid id);
}

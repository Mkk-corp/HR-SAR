using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface IFacilityService
{
    Task<IEnumerable<FacilityResponseDto>> GetAllAsync(string? search = null, string? type = null);
    Task<FacilityResponseDto?> GetByIdAsync(Guid id);
    Task<FacilityResponseDto> CreateAsync(CreateFacilityDto dto);
    Task<FacilityResponseDto?> UpdateAsync(Guid id, UpdateFacilityDto dto);
    Task<bool> DeleteAsync(Guid id);
}

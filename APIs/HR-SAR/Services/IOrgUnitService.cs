using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface IOrgUnitService
{
    Task<IEnumerable<OrgUnitDto>> GetAllAsync(string? search, string? type, string? status);
    Task<OrgUnitDto> GetTreeAsync();
    Task<OrgUnitDto?> GetByIdAsync(Guid id);
    Task<OrgUnitDto> CreateAsync(CreateOrgUnitDto dto);
    Task<OrgUnitDto?> UpdateAsync(Guid id, UpdateOrgUnitDto dto);
    Task<bool> DeleteAsync(Guid id);
}

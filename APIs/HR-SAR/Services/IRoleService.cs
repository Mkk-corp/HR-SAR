using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface IRoleService
{
    Task<List<RoleDto>> GetAllAsync();
    Task<RoleDetailDto?> GetByIdAsync(string id);
    Task<RoleDetailDto> CreateAsync(CreateRoleDto dto);
    Task<RoleDetailDto?> UpdateAsync(string id, UpdateRoleDto dto);
    Task<(bool Success, string? Error)> DeleteAsync(string id);
    Task<List<PermissionDto>> GetAllPermissionsAsync();
}

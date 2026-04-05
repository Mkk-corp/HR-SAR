using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public record RoleDto(
    string Id,
    string Name,
    string? Description,
    int PermissionCount,
    int UserCount,
    DateTime CreatedAt
);

public record RoleDetailDto(
    string Id,
    string Name,
    string? Description,
    List<PermissionDto> Permissions,
    int UserCount,
    DateTime CreatedAt
);

public record CreateRoleDto(
    [Required, MaxLength(100)] string Name,
    [MaxLength(300)] string? Description,
    List<int> PermissionIds
);

public record UpdateRoleDto(
    [Required, MaxLength(100)] string Name,
    [MaxLength(300)] string? Description,
    List<int> PermissionIds
);

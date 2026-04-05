using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public record UserDto(
    string Id,
    string Email,
    string FullName,
    string? JobTitle,
    bool IsActive,
    string[] Roles,
    DateTime CreatedAt
);

public record CreateUserDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MaxLength(200)] string FullName,
    [MaxLength(100)] string? JobTitle,
    [Required] string RoleId
);

public record UpdateUserDto(
    [Required, MaxLength(200)] string FullName,
    [MaxLength(100)] string? JobTitle,
    bool IsActive,
    string? RoleId
);

using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MaxLength(200)] string FullName,
    [MaxLength(100)] string? JobTitle,
    [Required] string RoleId
);

public record AuthResponseDto(
    string Token,
    string UserId,
    string Email,
    string FullName,
    string? JobTitle,
    string[] Roles,
    string[] Permissions,
    string? PhotoUrl = null
);

public record ChangePasswordDto(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword
);

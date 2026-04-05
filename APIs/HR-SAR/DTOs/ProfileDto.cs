using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public record ProfileDto(
    string Id,
    string Email,
    string FullName,
    string? JobTitle,
    string[] Roles,
    string[] Permissions
);

public record UpdateProfileDto(
    [Required, MaxLength(200)] string FullName,
    [MaxLength(100)] string? JobTitle
);

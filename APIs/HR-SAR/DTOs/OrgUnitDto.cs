using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public class OrgUnitDto
{
    public Guid Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string? ParentNameAr { get; set; }
    public string Status { get; set; } = string.Empty;
    public int PositionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrgUnitDto> Children { get; set; } = [];
}

public record CreateOrgUnitDto(
    [Required, MaxLength(200)] string NameAr,
    [MaxLength(200)] string NameEn,
    [Required, MaxLength(20)] string Type,
    Guid? ParentId,
    string Status = "active"
);

public record UpdateOrgUnitDto(
    [MaxLength(200)] string? NameAr,
    [MaxLength(200)] string? NameEn,
    [MaxLength(20)] string? Type,
    Guid? ParentId,
    string? Status
);

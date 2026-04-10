using System.ComponentModel.DataAnnotations;

namespace HR_SAR.Models;

public class OrganizationUnit
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    /// <summary>Division | Department | Section | Unit</summary>
    [Required, MaxLength(20)]
    public string Type { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "active"; // active | inactive

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public OrganizationUnit? Parent { get; set; }
    public ICollection<OrganizationUnit> Children { get; set; } = [];
    public ICollection<Position> Positions { get; set; } = [];
}

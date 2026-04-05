using System.ComponentModel.DataAnnotations;

namespace HR_SAR.Models;

public class Facility
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // اساسية | فرعيه

    public Guid? ParentId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string NationalNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CrNumber { get; set; } = string.Empty;

    public DateOnly? CrDate { get; set; }

    [MaxLength(20)]
    public string TaxNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string InsuranceNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string NationalAddress { get; set; } = string.Empty;

    [MaxLength(200)]
    public string WorkLocation { get; set; } = string.Empty;

    [MaxLength(200)]
    public string EconomicActivity { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Isic4 { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Facility? Parent { get; set; }
    public ICollection<Facility> Children { get; set; } = [];
    public ICollection<Employee> Employees { get; set; } = [];
}

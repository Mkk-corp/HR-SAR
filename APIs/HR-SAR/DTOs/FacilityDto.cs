using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public class CreateFacilityDto
{
    [Required] public string Name { get; set; } = string.Empty;
    [Required] public string Type { get; set; } = string.Empty; // اساسية | فرعيه

    public Guid? ParentId { get; set; }
    public string NationalNumber { get; set; } = string.Empty;
    public string CrNumber { get; set; } = string.Empty;
    public DateOnly? CrDate { get; set; }
    public string TaxNumber { get; set; } = string.Empty;
    public string InsuranceNumber { get; set; } = string.Empty;
    public string NationalAddress { get; set; } = string.Empty;
    public string WorkLocation { get; set; } = string.Empty;
    public string EconomicActivity { get; set; } = string.Empty;
    public string Isic4 { get; set; } = string.Empty;
}

public class UpdateFacilityDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public Guid? ParentId { get; set; }
    public string? NationalNumber { get; set; }
    public string? CrNumber { get; set; }
    public DateOnly? CrDate { get; set; }
    public string? TaxNumber { get; set; }
    public string? InsuranceNumber { get; set; }
    public string? NationalAddress { get; set; }
    public string? WorkLocation { get; set; }
    public string? EconomicActivity { get; set; }
    public string? Isic4 { get; set; }
}

public class FacilityResponseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string? ParentName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NationalNumber { get; set; } = string.Empty;
    public string CrNumber { get; set; } = string.Empty;
    public DateOnly? CrDate { get; set; }
    public string TaxNumber { get; set; } = string.Empty;
    public string InsuranceNumber { get; set; } = string.Empty;
    public string NationalAddress { get; set; } = string.Empty;
    public string WorkLocation { get; set; } = string.Empty;
    public string EconomicActivity { get; set; } = string.Empty;
    public string Isic4 { get; set; } = string.Empty;
    public int EmployeeCount { get; set; }
    public int SaudiCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public class CreateEmployeeDto
{
    [Required] public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    [Required] public string NationalId { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    [Required] public string Nationality { get; set; } = string.Empty;
    [Required] public string EmpType { get; set; } = string.Empty;
    public Guid? FacilityId { get; set; }
    [Required, Range(0, double.MaxValue)] public decimal Salary { get; set; }

    public string Status { get; set; } = "نشط";
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Manager { get; set; } = string.Empty;
    public string WorkLocation { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public DateOnly? EntryDate { get; set; }
    public DateOnly? IdExpiry { get; set; }
    public string Bank { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
}

public class UpdateEmployeeDto
{
    public string? Name { get; set; }
    public string? Nationality { get; set; }
    public string? EmpType { get; set; }
    public Guid? FacilityId { get; set; }
    public decimal? Salary { get; set; }
    public string? Status { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? Manager { get; set; }
    public string? WorkLocation { get; set; }
    public string? Grade { get; set; }
    public DateOnly? EntryDate { get; set; }
    public DateOnly? IdExpiry { get; set; }
    public string? Bank { get; set; }
    public string? Iban { get; set; }
    public string? CountryCode { get; set; }
    public string? Phone { get; set; }
    public string? PhotoUrl { get; set; }
}

public class EmployeeResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public string EmpType { get; set; } = string.Empty;
    public Guid? FacilityId { get; set; }
    public string? FacilityName { get; set; }
    public decimal Salary { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Manager { get; set; } = string.Empty;
    public string WorkLocation { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public DateOnly? EntryDate { get; set; }
    public DateOnly? IdExpiry { get; set; }
    public string Bank { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

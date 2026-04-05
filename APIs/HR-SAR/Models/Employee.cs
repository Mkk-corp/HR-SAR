using System.ComponentModel.DataAnnotations;

namespace HR_SAR.Models;

public class Employee
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(20)]
    public string NationalId { get; set; } = string.Empty;

    [MaxLength(20)]
    public string IdNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Nationality { get; set; } = string.Empty;

    [MaxLength(20)]
    public string EmpType { get; set; } = string.Empty; // سعودي | اجنبي

    public Guid? FacilityId { get; set; }

    public decimal Salary { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "نشط"; // نشط | غير نشط | خروج نهائي | خروج مؤقت | اجازة

    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(100)]
    public string JobTitle { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Manager { get; set; } = string.Empty;

    [MaxLength(200)]
    public string WorkLocation { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Grade { get; set; } = string.Empty;

    public DateOnly? EntryDate { get; set; }

    public DateOnly? IdExpiry { get; set; }

    [MaxLength(100)]
    public string Bank { get; set; } = string.Empty;

    [MaxLength(34)]
    public string Iban { get; set; } = string.Empty;

    [MaxLength(10)]
    public string CountryCode { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Facility? Facility { get; set; }
    public ICollection<Transfer> Transfers { get; set; } = [];
}

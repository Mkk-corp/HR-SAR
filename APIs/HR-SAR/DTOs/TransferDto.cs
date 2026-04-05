using System.ComponentModel.DataAnnotations;
using HR_SAR.Models;

namespace HR_SAR.DTOs;

public class CreateTransferDto
{
    [Required] public string Type { get; set; } = string.Empty; // internal | external
    [Required] public Guid EmployeeId { get; set; }

    public string? Direction { get; set; }
    public string? TransferSubType { get; set; }
    public DateOnly? EffectiveDate { get; set; }
    public TransferChanges? Changes { get; set; }
    public string? TargetCompany { get; set; }
    public string? Reason { get; set; }
    public DateOnly? ExpectedDate { get; set; }
    public TransferSettlement? Settlement { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
}

public class UpdateTransferStatusDto
{
    [Required] public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public string? GovernmentRefNumber { get; set; }
    public string? Notes { get; set; }
    public string? UpdatedBy { get; set; }
}

public class TransferResponseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Direction { get; set; }
    public string? TransferSubType { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateOnly? EffectiveDate { get; set; }
    public TransferChanges? Changes { get; set; }
    public string? TargetCompany { get; set; }
    public string? Reason { get; set; }
    public DateOnly? ExpectedDate { get; set; }
    public TransferSettlement? Settlement { get; set; }
    public string? GovernmentRefNumber { get; set; }
    public DateTime? CompletedDate { get; set; }
    public List<TransferAuditEntry> AuditLog { get; set; } = [];
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
}

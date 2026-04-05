using System.ComponentModel.DataAnnotations;

namespace HR_SAR.Models;

public class Transfer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // internal | external

    [MaxLength(10)]
    public string? Direction { get; set; } // out | in

    [MaxLength(30)]
    public string? TransferSubType { get; set; } // sponsorship | secondment

    // Employee snapshot
    public Guid EmployeeId { get; set; }

    [MaxLength(200)]
    public string EmployeeName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string EmployeeCode { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Status { get; set; } = "draft";
    // draft | pending_approval | approved | pending_government | completed | rejected | cancelled

    // Internal transfer
    public DateOnly? EffectiveDate { get; set; }

    // Stored as JSON via value converter in DbContext
    public TransferChanges? Changes { get; set; }

    // External transfer
    [MaxLength(200)]
    public string? TargetCompany { get; set; }

    public string? Reason { get; set; }

    public DateOnly? ExpectedDate { get; set; }

    // Stored as JSON via value converter in DbContext
    public TransferSettlement? Settlement { get; set; }

    // Government integration
    [MaxLength(100)]
    public string? GovernmentRefNumber { get; set; }

    public DateTime? CompletedDate { get; set; }

    // Stored as JSON via value converter in DbContext
    public List<TransferAuditEntry> AuditLog { get; set; } = [];

    // Metadata
    public string? Notes { get; set; }

    [MaxLength(200)]
    public string? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string? RejectionReason { get; set; }

    // Navigation
    public Employee? Employee { get; set; }
}

// ── Value objects (plain POCOs — serialized as JSON in DB) ──────────────────

public class TransferChanges
{
    public FieldChange? FacilityId { get; set; }
    public FieldChange? Branch { get; set; }
    public FieldChange? Department { get; set; }
    public FieldChange? JobTitle { get; set; }
    public FieldChange? Manager { get; set; }
    public FieldChange? WorkLocation { get; set; }
    public SalaryChange? Salary { get; set; }
    public FieldChange? Grade { get; set; }
}

public class FieldChange
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
}

public class SalaryChange
{
    public decimal From { get; set; }
    public decimal To { get; set; }
}

public class TransferSettlement
{
    public decimal PendingSalary { get; set; }
    public decimal LeaveBalance { get; set; }
    public decimal Loans { get; set; }
    public string YearsOfService { get; set; } = string.Empty;
    public decimal DailyRate { get; set; }
    public decimal Total { get; set; }
}

public class TransferAuditEntry
{
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string By { get; set; } = string.Empty;
    public string At { get; set; } = string.Empty;
}

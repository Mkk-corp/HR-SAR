using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public class PositionDto
{
    public Guid Id { get; set; }
    public Guid JobTitleId { get; set; }
    public string JobTitleNameAr { get; set; } = string.Empty;
    public string JobTitleCode { get; set; } = string.Empty;
    public Guid OrgUnitId { get; set; }
    public string OrgUnitNameAr { get; set; } = string.Empty;
    public Guid? ManagerPositionId { get; set; }
    public string? ManagerJobTitleNameAr { get; set; }
    public int Headcount { get; set; }
    public int FilledCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public record CreatePositionDto(
    [Required] Guid JobTitleId,
    [Required] Guid OrgUnitId,
    Guid? ManagerPositionId,
    [Range(1, int.MaxValue)] int Headcount,
    string Status = "active"
);

public record UpdatePositionDto(
    Guid? JobTitleId,
    Guid? OrgUnitId,
    Guid? ManagerPositionId,
    [Range(1, int.MaxValue)] int? Headcount,
    string? Status
);

public record AssignEmployeeDto(
    [Required] Guid EmployeeId,
    [Required] Guid PositionId,
    [Required] DateOnly StartDate
);

public record TransferEmployeeDto(
    [Required] Guid EmployeeId,
    [Required] Guid FromPositionId,
    [Required] Guid ToPositionId,
    [Required] DateOnly EffectiveDate
);

public class EmployeePositionDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public Guid PositionId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

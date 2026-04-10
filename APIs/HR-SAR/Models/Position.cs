using System.ComponentModel.DataAnnotations;

namespace HR_SAR.Models;

public class Position
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid JobTitleId { get; set; }

    public Guid OrgUnitId { get; set; }

    public Guid? ManagerPositionId { get; set; }

    /// <summary>Number of allowed employees in this position (≥ 1)</summary>
    public int Headcount { get; set; } = 1;

    [MaxLength(20)]
    public string Status { get; set; } = "active"; // active | inactive

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public JobTitle JobTitle { get; set; } = null!;
    public OrganizationUnit OrgUnit { get; set; } = null!;
    public Position? ManagerPosition { get; set; }
    public ICollection<Position> SubordinatePositions { get; set; } = [];
    public ICollection<EmployeePosition> EmployeePositions { get; set; } = [];
}

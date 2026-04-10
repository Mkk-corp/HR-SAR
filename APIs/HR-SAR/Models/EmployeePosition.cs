namespace HR_SAR.Models;

public class EmployeePosition
{
    public Guid EmployeeId { get; set; }
    public Guid PositionId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    // Navigation
    public Employee Employee { get; set; } = null!;
    public Position Position { get; set; } = null!;
}

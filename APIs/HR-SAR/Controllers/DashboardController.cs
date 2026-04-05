using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;

namespace HR_SAR.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db) => _db = db;

    /// <summary>Get dashboard statistics.</summary>
    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        var employees = await _db.Employees.Include(e => e.Facility).ToListAsync();
        var facilities = await _db.Facilities.Include(f => f.Employees).ToListAsync();
        var transfers = await _db.Transfers.ToListAsync();

        var stats = new
        {
            TotalEmployees = employees.Count,
            ActiveEmployees = employees.Count(e => e.Status == "نشط"),
            TotalFacilities = facilities.Count,
            TotalSalary = employees.Sum(e => e.Salary),
            SaudiCount = employees.Count(e => e.EmpType == "سعودي"),
            ForeignCount = employees.Count(e => e.EmpType == "اجنبي"),
            PendingTransfers = transfers.Count(t =>
                t.Status is "draft" or "pending_approval" or "pending_government"),
            RecentEmployees = employees
                .OrderByDescending(e => e.CreatedAt)
                .Take(6)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Code,
                    e.Status,
                    e.EmpType,
                    FacilityName = e.Facility?.Name,
                    e.CreatedAt,
                }),
            FacilityDistribution = facilities.Select(f => new
            {
                f.Id,
                f.Name,
                f.Type,
                EmployeeCount = f.Employees.Count,
                SaudiCount = f.Employees.Count(e => e.EmpType == "سعودي"),
            }),
        };

        return Ok(stats);
    }
}

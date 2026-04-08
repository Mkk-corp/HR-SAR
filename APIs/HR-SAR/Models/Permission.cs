namespace HR_SAR.Models;

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;        // e.g. "employees.create"
    public string DisplayName { get; set; } = string.Empty; // e.g. "إضافة موظف"
    public string Category { get; set; } = string.Empty;    // e.g. "Employees"
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}

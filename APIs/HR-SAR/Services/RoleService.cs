using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class RoleService(
    RoleManager<ApplicationRole> roleManager,
    AppDbContext db) : IRoleService
{
    public async Task<List<RoleDto>> GetAllAsync()
    {
        var roles = await roleManager.Roles
            .Include(r => r.RolePermissions)
            .ToListAsync();

        var result = new List<RoleDto>();
        foreach (var r in roles)
        {
            var userCount = await db.UserRoles.CountAsync(ur => ur.RoleId == r.Id);
            result.Add(new RoleDto(r.Id, r.Name!, r.Description, r.RolePermissions.Count, userCount, r.CreatedAt));
        }
        return result;
    }

    public async Task<RoleDetailDto?> GetByIdAsync(string id)
    {
        var role = await roleManager.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role is null) return null;

        var userCount = await db.UserRoles.CountAsync(ur => ur.RoleId == role.Id);
        var perms = role.RolePermissions
            .Select(rp => new PermissionDto(rp.Permission.Id, rp.Permission.Name, rp.Permission.DisplayName, rp.Permission.Category))
            .ToList();

        return new RoleDetailDto(role.Id, role.Name!, role.Description, perms, userCount, role.CreatedAt);
    }

    public async Task<RoleDetailDto> CreateAsync(CreateRoleDto dto)
    {
        var role = new ApplicationRole
        {
            Name        = dto.Name,
            Description = dto.Description,
        };

        var result = await roleManager.CreateAsync(role);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        await AssignPermissionsAsync(role.Id, dto.PermissionIds);

        return (await GetByIdAsync(role.Id))!;
    }

    public async Task<RoleDetailDto?> UpdateAsync(string id, UpdateRoleDto dto)
    {
        var role = await roleManager.FindByIdAsync(id);
        if (role is null) return null;

        role.Name        = dto.Name;
        role.Description = dto.Description;
        await roleManager.UpdateAsync(role);

        // Replace permissions
        var existing = db.RolePermissions.Where(rp => rp.RoleId == id);
        db.RolePermissions.RemoveRange(existing);
        await db.SaveChangesAsync();

        await AssignPermissionsAsync(id, dto.PermissionIds);

        return await GetByIdAsync(id);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(string id)
    {
        var role = await roleManager.FindByIdAsync(id);
        if (role is null) return (false, "الدور غير موجود");

        var hasUsers = await db.UserRoles.AnyAsync(ur => ur.RoleId == id);
        if (hasUsers) return (false, "لا يمكن حذف دور مُسنَد لمستخدمين");

        var result = await roleManager.DeleteAsync(role);
        return result.Succeeded ? (true, null) : (false, string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    public async Task<List<PermissionDto>> GetAllPermissionsAsync()
    {
        return await db.Permissions
            .OrderBy(p => p.Category).ThenBy(p => p.Name)
            .Select(p => new PermissionDto(p.Id, p.Name, p.DisplayName, p.Category))
            .ToListAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task AssignPermissionsAsync(string roleId, List<int> permissionIds)
    {
        if (permissionIds.Count == 0) return;
        var entries = permissionIds.Select(pid => new RolePermission { RoleId = roleId, PermissionId = pid });
        db.RolePermissions.AddRange(entries);
        await db.SaveChangesAsync();
    }
}

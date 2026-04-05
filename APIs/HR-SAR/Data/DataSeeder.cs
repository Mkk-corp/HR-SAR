using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HR_SAR.Models;

namespace HR_SAR.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db          = services.GetRequiredService<AppDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        await db.Database.MigrateAsync();

        // ── 1. Seed all permissions ───────────────────────────────────────────
        foreach (var (name, display, category) in Permissions.All())
        {
            if (!await db.Permissions.AnyAsync(p => p.Name == name))
            {
                db.Permissions.Add(new Permission { Name = name, DisplayName = display, Category = category });
            }
        }
        await db.SaveChangesAsync();

        var allPermissions = await db.Permissions.ToListAsync();

        // ── 2. Seed roles ─────────────────────────────────────────────────────
        await EnsureRoleAsync(roleManager, "SuperAdmin", "صلاحيات كاملة على جميع الميزات");
        await EnsureRoleAsync(roleManager, "Manager",    "مدير — صلاحيات محدودة");
        await EnsureRoleAsync(roleManager, "Employee",   "موظف — صلاحيات أساسية");

        // ── 3. Assign permissions to roles ────────────────────────────────────

        // SuperAdmin → all permissions (re-runs on every startup to pick up new ones)
        var superAdminRole = await roleManager.FindByNameAsync("SuperAdmin");
        if (superAdminRole is not null)
        {
            var existing = await db.RolePermissions
                .Where(rp => rp.RoleId == superAdminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var missing = allPermissions.Where(p => !existing.Contains(p.Id));
            db.RolePermissions.AddRange(missing.Select(p => new RolePermission
            {
                RoleId = superAdminRole.Id,
                PermissionId = p.Id,
            }));
            await db.SaveChangesAsync();
        }

        // Manager
        await EnsureRolePermissionsAsync(db, roleManager, "Manager", Permissions.ManagerPermissions, allPermissions);

        // Employee
        await EnsureRolePermissionsAsync(db, roleManager, "Employee", Permissions.EmployeePermissions, allPermissions);

        // ── 4. Seed default SuperAdmin user ───────────────────────────────────
        const string adminEmail    = "admin@hr-sar.com";
        const string adminPassword = "Admin@123456";

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email    = adminEmail,
                FullName = "مدير النظام",
                JobTitle = "System Administrator",
                IsActive = true,
                EmailConfirmed = true,
            };
            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "SuperAdmin");
        }
    }

    private static async Task EnsureRoleAsync(RoleManager<ApplicationRole> rm, string name, string description)
    {
        if (!await rm.RoleExistsAsync(name))
            await rm.CreateAsync(new ApplicationRole { Name = name, Description = description });
    }

    private static async Task EnsureRolePermissionsAsync(
        AppDbContext db,
        RoleManager<ApplicationRole> rm,
        string roleName,
        string[] permissionNames,
        List<Permission> allPermissions)
    {
        var role = await rm.FindByNameAsync(roleName);
        if (role is null) return;

        foreach (var permName in permissionNames)
        {
            var perm = allPermissions.FirstOrDefault(p => p.Name == permName);
            if (perm is null) continue;

            var exists = await db.RolePermissions
                .AnyAsync(rp => rp.RoleId == role.Id && rp.PermissionId == perm.Id);

            if (!exists)
                db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
        }
        await db.SaveChangesAsync();
    }
}

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class UserService(
    UserManager<ApplicationUser> userManager,
    AppDbContext db) : IUserService
{
    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await userManager.Users.OrderBy(u => u.FullName).ToListAsync();
        var result = new List<UserDto>();
        foreach (var u in users)
        {
            var roles = await userManager.GetRolesAsync(u);
            result.Add(Map(u, roles));
        }
        return result;
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return null;
        var roles = await userManager.GetRolesAsync(user);
        return Map(user, roles);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email    = dto.Email,
            FullName = dto.FullName,
            JobTitle = dto.JobTitle,
            IsActive = true,
            PhotoUrl = dto.PhotoUrl,
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        var role = await db.Roles.FindAsync(dto.RoleId);
        if (role is not null)
            await userManager.AddToRoleAsync(user, role.Name!);

        var roles = await userManager.GetRolesAsync(user);
        return Map(user, roles);
    }

    public async Task<UserDto?> UpdateAsync(string id, UpdateUserDto dto)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return null;

        user.FullName = dto.FullName;
        user.JobTitle = dto.JobTitle;
        user.IsActive = dto.IsActive;
        await userManager.UpdateAsync(user);

        if (dto.RoleId is not null)
        {
            var currentRoles = await userManager.GetRolesAsync(user);
            await userManager.RemoveFromRolesAsync(user, currentRoles);
            var role = await db.Roles.FindAsync(dto.RoleId);
            if (role is not null)
                await userManager.AddToRoleAsync(user, role.Name!);
        }

        var roles = await userManager.GetRolesAsync(user);
        return Map(user, roles);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return false;
        var result = await userManager.DeleteAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> ResetPasswordAsync(string id, string newPassword)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return false;
        var token  = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        return result.Succeeded;
    }

    private static UserDto Map(ApplicationUser u, IList<string> roles) =>
        new(u.Id, u.Email!, u.FullName, u.JobTitle, u.IsActive, [.. roles], u.CreatedAt, u.PhotoUrl);
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    AppDbContext db,
    IConfiguration config) : IAuthService
{
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null || !user.IsActive) return null;

        var valid = await userManager.CheckPasswordAsync(user, dto.Password);
        if (!valid) return null;

        return await BuildResponseAsync(user);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var user = new ApplicationUser
        {
            UserName  = dto.Email,
            Email     = dto.Email,
            FullName  = dto.FullName,
            JobTitle  = dto.JobTitle,
            IsActive  = true,
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        var role = await db.Roles.FindAsync(dto.RoleId);
        if (role is not null)
            await userManager.AddToRoleAsync(user, role.Name!);

        return await BuildResponseAsync(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<AuthResponseDto> BuildResponseAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);

        var permissions = await db.RolePermissions
            .Where(rp => db.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.RoleId)
                .Contains(rp.RoleId))
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToListAsync();

        var token = GenerateToken(user, roles, permissions);

        return new AuthResponseDto(
            token,
            user.Id,
            user.Email!,
            user.FullName,
            user.JobTitle,
            [.. roles],
            [.. permissions],
            user.PhotoUrl
        );
    }

    private string GenerateToken(ApplicationUser user, IList<string> roles, List<string> permissions)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(int.Parse(config["Jwt:ExpiryHours"] ?? "24"));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new("fullName", user.FullName),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        claims.AddRange(permissions.Select(p => new Claim("permission", p)));

        var token = new JwtSecurityToken(
            issuer:   config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:   claims,
            expires:  expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController(
    UserManager<ApplicationUser> userManager) : ControllerBase
{
    /// <summary>Get the currently logged-in user's profile.</summary>
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames);
        var user = await userManager.FindByIdAsync(userId!);
        if (user is null) return Unauthorized();

        var roles = await userManager.GetRolesAsync(user);
        var permissions = User.Claims
            .Where(c => c.Type == "permission")
            .Select(c => c.Value)
            .ToArray();

        return Ok(new ProfileDto(user.Id, user.Email!, user.FullName, user.JobTitle, [.. roles], permissions));
    }

    /// <summary>Update the currently logged-in user's own profile.</summary>
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        if (!User.HasClaim("permission", "profile.edit")) return Forbid();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames);
        var user = await userManager.FindByIdAsync(userId!);
        if (user is null) return Unauthorized();

        user.FullName = dto.FullName;
        user.JobTitle = dto.JobTitle;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var permissions = User.Claims
            .Where(c => c.Type == "permission")
            .Select(c => c.Value)
            .ToArray();

        return Ok(new ProfileDto(user.Id, user.Email!, user.FullName, user.JobTitle, [.. roles], permissions));
    }

    /// <summary>Change the currently logged-in user's password.</summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames);
        var user = await userManager.FindByIdAsync(userId!);
        if (user is null) return Unauthorized();

        var result = await userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        return NoContent();
    }

    private const string JwtRegisteredClaimNames = "sub";
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR_SAR.DTOs;
using HR_SAR.Services;

namespace HR_SAR.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController(IRoleService roleService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!User.HasClaim("permission", "roles.view")) return Forbid();
        return Ok(await roleService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        if (!User.HasClaim("permission", "roles.view")) return Forbid();
        var result = await roleService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetAllPermissions()
    {
        if (!User.HasClaim("permission", "roles.view")) return Forbid();
        return Ok(await roleService.GetAllPermissionsAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
    {
        if (!User.HasClaim("permission", "roles.create")) return Forbid();
        try
        {
            var result = await roleService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateRoleDto dto)
    {
        if (!User.HasClaim("permission", "roles.edit")) return Forbid();
        var result = await roleService.UpdateAsync(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!User.HasClaim("permission", "roles.delete")) return Forbid();
        var (success, error) = await roleService.DeleteAsync(id);
        if (!success) return BadRequest(new { message = error });
        return NoContent();
    }
}

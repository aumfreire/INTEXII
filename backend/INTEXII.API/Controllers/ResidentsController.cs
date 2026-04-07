using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Controllers;

// VIDEO NOTE: Show that hitting GET /api/residents without a cookie returns 401.
// After logging in as Admin, show that it returns 200.
// Show that a Donor user gets 403 on this endpoint.
[ApiController]
[Route("api/residents")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public ResidentsController(IntexDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all resident case records. Admin only (sensitive case data).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetAll()
    {
        var residents = await _db.Residents
            .OrderBy(r => r.ResidentId)
            .ToListAsync();
        return Ok(residents);
    }

    /// <summary>
    /// Returns a single resident by ID. Admin only.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        return Ok(resident);
    }

    /// <summary>
    /// Creates a new resident record. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, resident);
    }

    /// <summary>
    /// Updates a resident record. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Update(int id, [FromBody] Resident resident)
    {
        if (id != resident.ResidentId) return BadRequest();
        _db.Entry(resident).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Deletes a resident record. Admin only.
    /// Frontend must show a confirmation dialog before calling this endpoint.
    /// VIDEO NOTE: Show the confirmation dialog in the UI before this is called.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Delete(int id)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _db.Residents.Remove(resident);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

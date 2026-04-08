using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/safehouses")]
[Authorize]
public class SafehousesController : ControllerBase
{
    private readonly IntexDbContext _db;

    public SafehousesController(IntexDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns a list of all safehouses. Requires authentication.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var safehouses = await _db.Safehouses
            .OrderBy(s => s.SafehouseId)
            .ToListAsync();
        return Ok(safehouses);
    }

    /// <summary>
    /// Returns a single safehouse by ID. Requires authentication.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var safehouse = await _db.Safehouses.FindAsync(id);
        if (safehouse == null) return NotFound();
        return Ok(safehouse);
    }

    /// <summary>
    /// Creates a safehouse record. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Create([FromBody] Safehouse safehouse)
    {
        _db.Safehouses.Add(safehouse);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = safehouse.SafehouseId }, safehouse);
    }

    /// <summary>
    /// Updates a safehouse record. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Update(int id, [FromBody] Safehouse safehouse)
    {
        if (id != safehouse.SafehouseId) return BadRequest();
        _db.Entry(safehouse).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Deletes a safehouse record. Admin only.
    /// Frontend must show a confirmation dialog before calling this endpoint.
    /// VIDEO NOTE: Show the confirmation dialog in the UI before this is called.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Delete(int id)
    {
        var safehouse = await _db.Safehouses.FindAsync(id);
        if (safehouse == null) return NotFound();
        _db.Safehouses.Remove(safehouse);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

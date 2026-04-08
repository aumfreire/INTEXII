namespace INTEXII.API.Data;

public static class AuthPolicies
{
    /// <summary>
    /// Requires Admin role. Applied to all CREATE, UPDATE, DELETE endpoints.
    /// </summary>
    public const string ManageData = "ManageData";

    /// <summary>
    /// Requires Donor role. Applied to donor history and personal impact endpoints.
    /// </summary>
    public const string ViewDonorHistory = "ViewDonorHistory";
}

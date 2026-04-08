export default function CookiePolicyPage() {
    return (
        <div className="container py-5">
            <div className="login-card" style={{ maxWidth: '900px' }}>
                <h2 className="mb-3">Cookie Policy</h2>
                <p className="login-subtitle">
                    This app uses only essential cookies required for authentication and security.
                </p>

                <h5 className="mt-4">Essential Cookies Used</h5>
                <ul>
                    <li>The ASP.NET Core Identity cookie maintains authenticated sessions.</li>
                    <li>Temporary security cookies can be set during Google external login flow.</li>
                    <li>A local acknowledgement flag stores your cookie notice confirmation.</li>
                </ul>

                <h5 className="mt-4">What This App Does Not Use</h5>
                <ul>
                    <li>No analytics cookies.</li>
                    <li>No advertising cookies.</li>
                    <li>No cross-site tracking scripts.</li>
                </ul>
            </div>
        </div>
    );
}

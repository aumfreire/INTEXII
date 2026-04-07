import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function DashboardPage() {
    const { authSession } = useAuth();

    return (
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '720px' }}>
                <h2>My Dashboard</h2>
                <p className="login-subtitle" style={{ marginBottom: '20px' }}>
                    Hello, {authSession.userName ?? authSession.email ?? 'there'}.
                </p>
                <p>
                    You are signed in as <strong>{authSession.email ?? 'unknown user'}</strong>.
                </p>
                <p>
                    Current roles: <strong>{authSession.roles.join(', ') || 'None'}</strong>
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link to="/profile" className="btn btn-primary">
                        Edit Profile
                    </Link>
                    <Link to="/mfa" className="btn btn-outline-secondary">
                        Manage MFA
                    </Link>
                    <Link to="/donate" className="btn btn-outline-secondary">
                        Go to Donations
                    </Link>
                </div>
            </div>
        </div>
    );
}

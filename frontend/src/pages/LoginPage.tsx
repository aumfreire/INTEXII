import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import {
  buildExternalLoginUrl,
  getExternalProviders,
  getAuthSession,
  loginUser,
  type ExternalAuthProvider,
} from '../lib/authAPI';
import { useAuth } from '../context/useAuth';
import '../styles/pages/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuthState } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [externalProviders, setExternalProviders] = useState<
    ExternalAuthProvider[]
  >([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('externalError') ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadExternalProviders();
  }, []);

  async function loadExternalProviders() {
    try {
      const providers = await getExternalProviders();
      setExternalProviders(providers);
    } catch {
      setExternalProviders([]);
    } finally {
      setProvidersLoaded(true);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const errors: Record<string, string> = {};

    if (!email.trim()) errors.email = 'Email is required';
    if (!password.trim()) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      await loginUser(
        email,
        password,
        rememberMe,
        twoFactorCode || undefined,
        recoveryCode || undefined
      );

      const session = await getAuthSession();
      if (!session.isAuthenticated) {
        setError(
          'Login succeeded but session cookie was not established. Restart backend after latest cookie config and ensure frontend runs on http://localhost:3000.'
        );
        return;
      }

      await refreshAuthState();
      navigate('/dashboard');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleExternalLogin(providerName: string) {
    window.location.assign(buildExternalLoginUrl(providerName, '/dashboard'));
  }

  return (
    <div className="login-page">
      <div className="container" style={{ padding: '0 24px' }}>
        <div className="row g-4 justify-content-center align-items-stretch">
          {/* Side panel - desktop only */}
          <div className="col-lg-5 d-none d-lg-block">
            <div className="login-side-panel">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '32px',
                  }}
                >
                  <Heart size={28} fill="rgba(255,255,255,0.9)" />
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                    }}
                  >
                    Haven of Hope
                  </span>
                </div>
                <h2 style={{ fontSize: '1.75rem', lineHeight: '1.3' }}>
                  Welcome back to making a difference
                </h2>
                <p style={{ marginBottom: '24px' }}>
                  Your work helps create safety, healing, and opportunity for
                  girls who need it most. Thank you for being part of this
                  mission.
                </p>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-sm)',
                    fontStyle: 'italic',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                  }}
                >
                  &ldquo;The best way to find yourself is to lose yourself in
                  the service of others.&rdquo;
                </div>
                <p
                  style={{
                    fontSize: '0.8rem',
                    marginTop: '16px',
                    opacity: 0.6,
                  }}
                >
                  Staff & Admin Access
                </p>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="col-lg-5">
            <div className="login-card">
              <h2>Welcome Back</h2>
              <p className="login-subtitle">
                Sign in to continue supporting our mission.
              </p>

              {error && (
                <AlertBanner
                  message={error}
                  type="warning"
                  onClose={() => setError('')}
                />
              )}

              <form onSubmit={handleSubmit} noValidate>
                <FormInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email)
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="you@example.com"
                  icon={<Mail size={18} />}
                  error={fieldErrors.email}
                  required
                />

                <FormInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password"
                  icon={<Lock size={18} />}
                  error={fieldErrors.password}
                  required
                >
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </FormInput>

                <FormInput
                  label="Authenticator Code (MFA)"
                  name="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Optional, if MFA is enabled"
                />

                <FormInput
                  label="Recovery Code"
                  name="recoveryCode"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="Use if you cannot access your authenticator"
                />

                <div className="login-utilities">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--color-cta)' }}
                    />
                    Remember me
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        'Password reset is not configured yet. Use Edit Profile after login to change your password.'
                      );
                    }}
                    style={{ color: 'var(--color-cta)', fontSize: '0.9rem' }}
                  >
                    Forgot password?
                  </a>
                </div>

                <PrimaryButton
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Sign In
                </PrimaryButton>
              </form>

              <div className="login-divider">
                <span>or</span>
              </div>

              {externalProviders.map((provider) => (
                <button
                  key={provider.name}
                  className="social-btn"
                  type="button"
                  onClick={() => handleExternalLogin(provider.name)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with {provider.displayName}
                </button>
              ))}

              {providersLoaded && externalProviders.length === 0 ? (
                <div className="alert alert-secondary mt-3 mb-0" role="status">
                  Google sign-in is currently unavailable. Configure
                  Authentication:Google:ClientId and Authentication:Google:ClientSecret
                  in local user-secrets (or appsettings.Secrets.json) and restart the backend.
                </div>
              ) : null}

              <p className="signup-link">
                Don&apos;t have an account?{' '}
                <Link to="/signup" style={{ fontWeight: 600 }}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

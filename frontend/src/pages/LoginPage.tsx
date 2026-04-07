import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import loginPanel from '../assets/haven/login-panel.webp';
import '../styles/pages/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      if (email === 'error@test.com') {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
      } else {
        navigate('/');
      }
    }, 1500);
  };

  return (
    <div className="login-page">
      {/* Left image panel */}
      <div
        className="login-image-panel d-none d-lg-flex"
        style={{ backgroundImage: `url(${loginPanel})` }}
      >
        <div className="login-image-overlay" />
        <div className="login-image-content">
          {/* Logo */}
          <div className="login-panel-logo">
            <Shield size={24} fill="rgba(255,255,255,0.9)" style={{ color: 'rgba(255,255,255,0.9)' }} />
            <span>Haven</span>
          </div>

          {/* Spacer pushes content to bottom */}
          <div style={{ flex: 1 }} />

          {/* Quote */}
          <div className="login-panel-quote">
            <div className="login-quote-bar" />
            <p className="login-quote-text">
              &ldquo;Every girl deserves to be safe, seen, and free.&rdquo;
            </p>
          </div>

          <p className="login-panel-welcome">
            Welcome back to the Haven staff portal. Your work makes a
            difference every single day.
          </p>

          {/* Mini stats */}
          <div className="login-panel-stats">
            <div className="login-stat">
              <span className="login-stat-number">4,200+</span>
              <span className="login-stat-label">Girls Served</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-number">18</span>
              <span className="login-stat-label">Safe Houses</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-number">92%</span>
              <span className="login-stat-label">School Retention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-muted)',
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginBottom: '32px',
            }}
          >
            <ArrowLeft size={16} />
            Back to website
          </Link>

          <h2 style={{ marginBottom: '8px' }}>Welcome Back</h2>
          <p className="login-subtitle">
            Sign in to your account to continue.
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
              placeholder="you@havenforgirlsorg.org"
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

            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '20px' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset functionality coming soon.');
                }}
                style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}
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
              Log In
            </PrimaryButton>
          </form>

          {/* Security info */}
          <div
            style={{
              marginTop: '24px',
              padding: '14px 16px',
              backgroundColor: 'rgba(122, 158, 126, 0.08)',
              border: '1px solid rgba(122, 158, 126, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--color-muted)',
              lineHeight: '1.6',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Shield size={18} style={{ flexShrink: 0, color: 'var(--color-sage)', marginTop: '2px' }} />
            <span>
              This is a secure, encrypted portal. Your login credentials are
              protected with industry-standard security.
            </span>
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '0.9rem',
              color: 'var(--color-muted)',
            }}
          >
            Don&apos;t have an account?{' '}
            <Link to="/signup" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import { buildExternalLoginUrl, registerUser } from '../lib/authAPI';
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, meetsPasswordPolicy } from '../lib/passwordPolicy';
import '../styles/pages/login.css';

export default function SignUpPage() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) => {
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const errors: Record<string, string> = {};

        if (!firstName.trim()) errors.firstName = 'First name is required';
        if (!lastName.trim()) errors.lastName = 'Last name is required';
        if (!email.trim()) errors.email = 'Email is required';
        if (!password.trim()) errors.password = 'Password is required';
        else if (!meetsPasswordPolicy(password))
            errors.password = PASSWORD_POLICY_MESSAGE;
        if (!confirmPassword.trim()) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setIsLoading(true);

        try {
            await registerUser(email, password);
            setSuccess('Account created successfully. Redirecting to login...');
            setTimeout(() => navigate('/login'), 900);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Unable to create your account.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    function handleExternalRegister() {
        window.location.assign(buildExternalLoginUrl('Google', '/dashboard'));
    }

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h2 style={{ marginBottom: '8px' }}>Create Account</h2>
                <p className="login-subtitle">
                    Join us in making a difference for vulnerable girls.
                </p>

                {error && (
                    <AlertBanner
                        message={error}
                        type="warning"
                        onClose={() => setError('')}
                    />
                )}
                {success && (
                    <AlertBanner
                        message={success}
                        type="success"
                        onClose={() => setSuccess('')}
                    />
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="row g-3">
                        <div className="col-6">
                            <FormInput
                                label="First Name"
                                name="firstName"
                                value={firstName}
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                    clearError('firstName');
                                }}
                                placeholder="Jane"
                                icon={<User size={18} />}
                                error={fieldErrors.firstName}
                                required
                            />
                        </div>
                        <div className="col-6">
                            <FormInput
                                label="Last Name"
                                name="lastName"
                                value={lastName}
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    clearError('lastName');
                                }}
                                placeholder="Smith"
                                error={fieldErrors.lastName}
                                required
                            />
                        </div>
                    </div>

                    <FormInput
                        label="Email Address"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            clearError('email');
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
                            clearError('password');
                        }}
                        placeholder="At least 14 characters"
                        minLength={PASSWORD_MIN_LENGTH}
                        icon={<Lock size={18} />}
                        error={fieldErrors.password}
                        required
                    >
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </FormInput>

                    <FormInput
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            clearError('confirmPassword');
                        }}
                        placeholder="Re-enter your password"
                        icon={<Lock size={18} />}
                        error={fieldErrors.confirmPassword}
                        required
                    >
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </FormInput>

                    <PrimaryButton
                        type="submit"
                        fullWidth
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        Create Account
                    </PrimaryButton>
                </form>

                <div className="login-divider">
                    <span>or</span>
                </div>

                <button
                    className="social-btn"
                    type="button"
                    onClick={handleExternalRegister}
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
                    Sign up with Google
                </button>

                <p className="signup-link">
                    Already have an account?{' '}
                    <Link to="/login" style={{ fontWeight: 600 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
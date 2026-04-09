import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    Menu,
    X,
    Heart,
    ChevronDown,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const closeMenuTimeoutRef = useRef<number | null>(null);
    const { authSession, isAuthenticated, isLoading } = useAuth();
    const isAdmin = authSession.roles.includes('Admin');
    const displayName = authSession.displayName ?? authSession.userName ?? authSession.email ?? 'User';

    const clearMenuCloseTimeout = () => {
        if (closeMenuTimeoutRef.current !== null) {
            window.clearTimeout(closeMenuTimeoutRef.current);
            closeMenuTimeoutRef.current = null;
        }
    };

    const openUserMenu = () => {
        if (!isAdmin) {
            clearMenuCloseTimeout();
            setIsUserMenuOpen(true);
        } else {
            clearMenuCloseTimeout();
            setIsUserMenuOpen(true);
        }
    };

    const scheduleUserMenuClose = () => {
        clearMenuCloseTimeout();
        closeMenuTimeoutRef.current = window.setTimeout(() => {
            setIsUserMenuOpen(false);
        }, 120);
    };

    const navLinkStyle = ({
        isActive,
    }: {
        isActive: boolean;
    }): React.CSSProperties => ({
        color: isActive ? 'var(--color-cta)' : 'var(--color-charcoal)',
        fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        transition: 'color var(--transition-fast)',
        fontSize: '0.95rem',
    });

    const closeMenus = () => {
        clearMenuCloseTimeout();
        setIsOpen(false);
        setIsUserMenuOpen(false);
    };

    useEffect(() => {
        return () => {
            clearMenuCloseTimeout();
        };
    }, []);

    useEffect(() => {
        if (!isUserMenuOpen) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
            const targetNode = event.target as Node | null;
            if (userMenuRef.current && targetNode && !userMenuRef.current.contains(targetNode)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [isUserMenuOpen]);

    return (
        <nav
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                width: '100%',
                backgroundColor: 'rgba(249, 245, 234, 0.98)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                backdropFilter: 'none',
            }}
        >
            <div className="container" style={{ padding: '0 24px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '70px',
                    }}
                >
                    <Link
                        to="/"
                        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            color: 'var(--color-charcoal)',
                        }}
                    >
                        <Heart
                            size={28}
                            style={{ color: 'var(--color-cta)' }}
                            fill="var(--color-cta)"
                        />
                        <span
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1.35rem',
                                fontWeight: 700,
                            }}
                        >
                            Haven of Hope
                        </span>
                    </Link>

                    <div
                        className="d-none d-lg-flex"
                        style={{ alignItems: 'center', gap: '4px' }}
                    >
                        <NavLink
                            to="/"
                            style={navLinkStyle}
                            end
                            onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
                        >
                            Home
                        </NavLink>
                        <Link to="/#mission" style={{ ...navLinkStyle({ isActive: false }) }}>
                            About
                        </Link>
                        <NavLink to="/impact" style={navLinkStyle}>
                            Impact
                        </NavLink>
                        {!isLoading && !isAuthenticated ? (
                            <NavLink to="/login" style={navLinkStyle}>
                                Login
                            </NavLink>
                        ) : null}
                        {!isLoading && isAuthenticated ? (
                            <div
                                ref={userMenuRef}
                                style={{ position: 'relative', marginLeft: '8px' }}
                                onMouseEnter={() => {
                                    clearMenuCloseTimeout();
                                    setIsUserMenuOpen(true);
                                }}
                                onMouseLeave={scheduleUserMenuClose}
                            >
                                <Link
                                    to="/dashboard"
                                    onClick={closeMenus}
                                    onFocus={openUserMenu}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1px solid rgba(58, 63, 59, 0.16)',
                                        background:
                                            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,244,236,0.98) 100%)',
                                        color: 'var(--color-charcoal)',
                                        borderRadius: '999px',
                                        padding: '9px 14px',
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                                        textDecoration: 'none',
                                        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 10px 18px rgba(0,0,0,0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)';
                                    }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {displayName}
                                        </span>
                                        <ChevronDown size={15} />
                                    </span>
                                </Link>
                                {isUserMenuOpen ? (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 10px)',
                                            right: 0,
                                            minWidth: '280px',
                                            background:
                                                'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,249,243,0.98) 100%)',
                                            border: '1px solid rgba(58, 63, 59, 0.12)',
                                            borderRadius: '18px',
                                            boxShadow: '0 20px 40px rgba(25, 31, 28, 0.14)',
                                            padding: '12px',
                                            zIndex: 2000,
                                        }}
                                    >
                                        <div style={{ padding: '4px 8px 10px' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                                                Account
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-charcoal)', marginTop: '4px' }}>
                                                {displayName}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid rgba(58, 63, 59, 0.10)', margin: '8px 0' }} />

                                        <div style={{ display: 'grid', gap: '4px' }}>
                                            <MenuLink to="/dashboard" icon={LayoutDashboard} label="My Dashboard" description="Overview and quick actions" onClick={closeMenus} />
                                            <MenuLink to="/profile" icon={Settings} label="Edit Profile" description="Update personal details" onClick={closeMenus} />
                                        </div>

                                        {isAdmin ? (
                                            <>
                                                <div style={{ borderTop: '1px solid rgba(58, 63, 59, 0.10)', margin: '10px 0' }} />
                                                <div style={{ padding: '0 8px 8px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                                                    Admin Tools
                                                </div>
                                                <div style={{ display: 'grid', gap: '4px' }}>
                                                    <MenuLink to="/admin" icon={ShieldCheck} label="Admin Dashboard" description="User management and metrics" onClick={closeMenus} />
                                                </div>
                                            </>
                                        ) : null}

                                        <div style={{ borderTop: '1px solid rgba(58, 63, 59, 0.12)', margin: '10px 0 8px' }} />

                                        <Link
                                            to="/logout"
                                            onClick={closeMenus}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                textDecoration: 'none',
                                                color: '#9d2f21',
                                                padding: '12px 12px',
                                                borderRadius: '14px',
                                                background: 'rgba(193, 96, 58, 0.10)',
                                                fontWeight: 800,
                                            }}
                                        >
                                            <span style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(157, 47, 33, 0.12)', flexShrink: 0 }}>
                                                <LogOut size={16} />
                                            </span>
                                            <span>
                                                <span style={{ display: 'block' }}>Logout</span>
                                                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(157, 47, 33, 0.78)' }}>
                                                    End your session securely
                                                </span>
                                            </span>
                                        </Link>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <Link
                            to="/donate"
                            style={{
                                marginLeft: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 22px',
                                background: 'linear-gradient(180deg, #c1603a 0%, #ab553a 100%)',
                                color: '#ffffff',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                lineHeight: 1,
                                textDecoration: 'none',
                                border: '1px solid #c1603a',
                                boxShadow: '0 8px 18px rgba(193, 96, 58, 0.28)',
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.12)',
                                whiteSpace: 'nowrap',
                                transition:
                                    'background-color var(--transition-fast), transform var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(180deg, #ab553a 0%, #8f462f 100%)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(180deg, #c1603a 0%, #ab553a 100%)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Heart size={16} />
                            Donate Now
                        </Link>
                    </div>

                    <button
                        className="d-lg-none"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle navigation"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            color: 'var(--color-charcoal)',
                        }}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {isOpen && (
                    <div
                        className="d-lg-none"
                        style={{
                            paddingBottom: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        <NavLink
                            to="/"
                            style={navLinkStyle}
                            onClick={() => {
                                setIsOpen(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                            }}
                            end
                        >
                            Home
                        </NavLink>
                        <Link
                            to="/#mission"
                            style={{ ...navLinkStyle({ isActive: false }) }}
                            onClick={closeMenus}
                        >
                            About
                        </Link>
                        <NavLink
                            to="/impact"
                            style={navLinkStyle}
                            onClick={closeMenus}
                        >
                            Impact
                        </NavLink>
                        {!isLoading && !isAuthenticated ? (
                            <NavLink
                                to="/login"
                                style={navLinkStyle}
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </NavLink>
                        ) : null}
                        {!isLoading && isAuthenticated ? (
                            <>
                                <div
                                    style={{
                                        marginTop: '8px',
                                        padding: '8px 16px',
                                        color: 'var(--color-muted)',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Hello, {displayName}
                                </div>
                                <MobileMenuSection title="Account">
                                    <MobileMenuLink to="/dashboard" icon={LayoutDashboard} label="My Dashboard" description="Overview and quick actions" onClick={closeMenus} />
                                    <MobileMenuLink to="/profile" icon={Settings} label="Edit Profile" description="Update personal details" onClick={closeMenus} />
                                </MobileMenuSection>
                                {isAdmin ? (
                                    <MobileMenuSection title="Admin Tools">
                                        <MobileMenuLink to="/admin" icon={ShieldCheck} label="Admin Dashboard" description="User management and metrics" onClick={closeMenus} />
                                    </MobileMenuSection>
                                ) : null}
                                <Link
                                    to="/logout"
                                    onClick={closeMenus}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        textDecoration: 'none',
                                        color: '#9d2f21',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        background: 'rgba(193, 96, 58, 0.10)',
                                        fontWeight: 800,
                                        marginTop: '8px',
                                        border: '1px solid rgba(157, 47, 33, 0.10)',
                                    }}
                                >
                                    <span style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(157, 47, 33, 0.12)', flexShrink: 0 }}>
                                        <LogOut size={16} />
                                    </span>
                                    <span>
                                        <span style={{ display: 'block' }}>Logout</span>
                                        <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(157, 47, 33, 0.78)' }}>
                                            End your session securely
                                        </span>
                                    </span>
                                </Link>
                            </>
                        ) : null}
                        <Link
                            to="/donate"
                            onClick={closeMenus}
                            style={{
                                marginTop: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '10px 22px',
                                background: 'linear-gradient(180deg, #c1603a 0%, #ab553a 100%)',
                                color: '#ffffff',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                textDecoration: 'none',
                                border: '1px solid #c1603a',
                                boxShadow: '0 8px 18px rgba(193, 96, 58, 0.28)',
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.12)',
                            }}
                        >
                            <Heart size={16} />
                            Donate Now
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

function MenuLink({
    to,
    icon: Icon,
    label,
    description,
    onClick,
}: {
    to: string;
    icon: typeof LayoutDashboard;
    label: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <Link
            to={to}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'var(--color-charcoal)',
                padding: '12px 12px',
                borderRadius: '14px',
                transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = 'rgba(193, 96, 58, 0.08)';
                event.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent';
                event.currentTarget.style.transform = 'translateX(0)';
            }}
        >
            <span style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, rgba(193,96,58,0.12), rgba(171,85,58,0.06))', color: 'var(--color-cta)', flexShrink: 0 }}>
                <Icon size={18} />
            </span>
            <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
                <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-muted)', lineHeight: 1.35 }}>{description}</span>
            </span>
        </Link>
    );
}

function MobileMenuSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: '10px' }}>
            <div style={{ padding: '6px 16px 10px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                {title}
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>{children}</div>
            <div style={{ margin: '12px 16px 0', borderTop: '1px solid rgba(58, 63, 59, 0.10)' }} />
        </div>
    );
}

function MobileMenuLink({
    to,
    icon: Icon,
    label,
    description,
    onClick,
}: {
    to: string;
    icon: typeof LayoutDashboard;
    label: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <Link
            to={to}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'var(--color-charcoal)',
                padding: '12px 16px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(58, 63, 59, 0.08)',
            }}
        >
            <span style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, rgba(193,96,58,0.12), rgba(171,85,58,0.06))', color: 'var(--color-cta)', flexShrink: 0 }}>
                <Icon size={18} />
            </span>
            <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
                <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-muted)', lineHeight: 1.35 }}>{description}</span>
            </span>
        </Link>
    );
}
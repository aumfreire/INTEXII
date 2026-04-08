import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Heart, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const { authSession, isAuthenticated, isLoading } = useAuth();
    const isAdmin = authSession.roles.includes('Admin');
    const displayName = authSession.displayName ?? authSession.userName ?? authSession.email ?? 'User';

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
        setIsOpen(false);
        setIsUserMenuOpen(false);
    };

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
                        <Link to="/#impact" style={{ ...navLinkStyle({ isActive: false }) }}>
                            Impact
                        </Link>
                        {!isLoading && !isAuthenticated ? (
                            <NavLink to="/login" style={navLinkStyle}>
                                Login
                            </NavLink>
                        ) : null}
                        {!isLoading && isAuthenticated ? (
                            <div ref={userMenuRef} style={{ position: 'relative', marginLeft: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1px solid var(--color-light-gray)',
                                        backgroundColor: 'var(--color-white)',
                                        color: 'var(--color-charcoal)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '8px 12px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    Hello, {displayName}
                                    <ChevronDown size={16} />
                                </button>
                                {isUserMenuOpen ? (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '110%',
                                            right: 0,
                                            minWidth: '220px',
                                            backgroundColor: 'var(--color-white)',
                                            border: '1px solid var(--color-light-gray)',
                                            borderRadius: 'var(--radius-sm)',
                                            boxShadow: 'var(--shadow-md)',
                                            padding: '8px',
                                            zIndex: 2000,
                                        }}
                                    >
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            style={{
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'var(--color-charcoal)',
                                                padding: '8px 10px',
                                                borderRadius: 'var(--radius-sm)',
                                            }}
                                        >
                                            My Dashboard
                                        </Link>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            style={{
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'var(--color-charcoal)',
                                                padding: '8px 10px',
                                                borderRadius: 'var(--radius-sm)',
                                            }}
                                        >
                                            Edit Profile
                                        </Link>
                                        {isAdmin ? (
                                            <Link
                                                to="/admin"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                style={{
                                                    display: 'block',
                                                    textDecoration: 'none',
                                                    color: 'var(--color-charcoal)',
                                                    padding: '8px 10px',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        ) : null}
                                        {isAdmin ? (
                                            <Link
                                                to="/admin/donations"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                style={{
                                                    display: 'block',
                                                    textDecoration: 'none',
                                                    color: 'var(--color-charcoal)',
                                                    padding: '8px 10px',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}
                                            >
                                                Manage Donations
                                            </Link>
                                        ) : null}
                                        <Link
                                            to="/logout"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            style={{
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'var(--color-cta)',
                                                padding: '8px 10px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Logout
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
                        <Link
                            to="/#impact"
                            style={{ ...navLinkStyle({ isActive: false }) }}
                            onClick={closeMenus}
                        >
                            Impact
                        </Link>
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
                                <NavLink
                                    to="/dashboard"
                                    style={navLinkStyle}
                                    onClick={() => setIsOpen(false)}
                                >
                                    My Dashboard
                                </NavLink>
                                <NavLink
                                    to="/profile"
                                    style={navLinkStyle}
                                    onClick={() => setIsOpen(false)}
                                >
                                    Edit Profile
                                </NavLink>
                                {isAdmin ? (
                                    <NavLink
                                        to="/admin"
                                        style={navLinkStyle}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Admin Dashboard
                                    </NavLink>
                                ) : null}
                                {isAdmin ? (
                                    <NavLink
                                        to="/admin/donations"
                                        style={navLinkStyle}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Manage Donations
                                    </NavLink>
                                ) : null}
                                <NavLink
                                    to="/logout"
                                    style={navLinkStyle}
                                    onClick={() => setIsOpen(false)}
                                >
                                    Logout
                                </NavLink>
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
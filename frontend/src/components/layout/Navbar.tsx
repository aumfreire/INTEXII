import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinkStyle = ({
    isActive,
  }: {
    isActive: boolean;
  }): React.CSSProperties => ({
    color: isActive ? 'var(--color-primary)' : 'var(--color-dark)',
    fontWeight: isActive ? 600 : 500,
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast)',
    fontSize: '0.95rem',
  });

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-cream)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'var(--color-dark)',
            }}
          >
            <Shield
              size={28}
              style={{ color: 'var(--color-primary)' }}
              fill="var(--color-primary)"
            />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 700,
              }}
            >
              Haven
            </span>
          </Link>

          {/* Desktop nav */}
          <div
            className="d-none d-lg-flex"
            style={{ alignItems: 'center', gap: '4px' }}
          >
            <NavLink to="/" style={navLinkStyle} end>
              Home
            </NavLink>
            <a href="#mission" style={{ ...navLinkStyle({ isActive: false }) }}>
              About
            </a>
            <a href="#impact" style={{ ...navLinkStyle({ isActive: false }) }}>
              Impact
            </a>
            <NavLink to="/login" style={navLinkStyle}>
              Login
            </NavLink>
            <Link
              to="/donate"
              style={{
                marginLeft: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 22px',
                backgroundColor: 'var(--color-primary-dark)',
                color: 'var(--color-light)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition:
                  'background-color var(--transition-fast), transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  'var(--color-primary-dark)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Donate Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="d-lg-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--color-dark)',
            }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
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
              onClick={() => setIsOpen(false)}
              end
            >
              Home
            </NavLink>
            <a
              href="#mission"
              style={{ ...navLinkStyle({ isActive: false }) }}
              onClick={() => setIsOpen(false)}
            >
              About
            </a>
            <a
              href="#impact"
              style={{ ...navLinkStyle({ isActive: false }) }}
              onClick={() => setIsOpen(false)}
            >
              Impact
            </a>
            <NavLink
              to="/login"
              style={navLinkStyle}
              onClick={() => setIsOpen(false)}
            >
              Login
            </NavLink>
            <Link
              to="/donate"
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 22px',
                backgroundColor: 'var(--color-primary-dark)',
                color: 'var(--color-light)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Donate Now
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

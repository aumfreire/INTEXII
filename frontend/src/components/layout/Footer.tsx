import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-dark)',
        color: 'rgba(255,255,255,0.8)',
        padding: '60px 0 0',
      }}
    >
      <div className="container" style={{ padding: '0 24px' }}>
        <div className="row g-4">
          {/* Brand & Mission */}
          <div className="col-lg-4 col-md-6">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <Heart
                size={24}
                style={{ color: 'var(--color-primary)' }}
                fill="var(--color-primary)"
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-white)',
                }}
              >
                Haven
              </span>
            </div>
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: '1.7',
                maxWidth: '320px',
              }}
            >
              Protecting, supporting, healing, and empowering vulnerable girls
              — because every girl deserves to be safe, seen, and free.
            </p>
          </div>

          {/* Organization */}
          <div className="col-lg-2 col-md-6">
            <h4
              style={{
                color: 'var(--color-white)',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '16px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Organization
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {[
                { label: 'About Us', to: '/#mission' },
                { label: 'Impact', to: '/#impact' },
                { label: 'Donate', to: '/donate' },
              ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = 'var(--color-primary-light)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')
                      }
                    >
                      {label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Get Involved */}
          <div className="col-lg-2 col-md-6">
            <h4
              style={{
                color: 'var(--color-white)',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '16px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Get Involved
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {[
                { to: '/donate', label: 'Donate' },
                { to: '/login', label: 'Log In' },
                { to: '/signup', label: 'Create Account' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--color-primary-light)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-4 col-md-6">
            <h4
              style={{
                color: 'var(--color-white)',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '16px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Contact
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} style={{ flexShrink: 0 }} />
                <span>123 Haven Way, Washington, DC 20001</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} style={{ flexShrink: 0 }} />
                <span>+1 (800) 555-HAVEN</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ flexShrink: 0 }} />
                <span>hello@havenforgirls.org</span>
              </div>
            </div>

            {/* Newsletter signup */}
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                Stay updated with our newsletter
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Your email"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--color-white)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                />
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-primary-dark)',
                    color: 'var(--color-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '40px',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <div className="container">
          &copy; {new Date().getFullYear()} Haven. All rights
          reserved. A registered 501(c)(3) nonprofit organization.
          <span style={{ margin: '0 12px' }}>|</span>
          <Link
            to="/cookies"
            style={{
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
          >
            Privacy Policy
          </Link>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>Terms of Use</span>
        </div>
      </div>
    </footer>
  );
}

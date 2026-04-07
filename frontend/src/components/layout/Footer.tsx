import { Link } from 'react-router-dom';
import { Heart, Globe, MessageCircle, Camera, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-charcoal)',
        color: 'rgba(255,255,255,0.8)',
        padding: '60px 0 0',
      }}
    >
      <div className="container" style={{ padding: '0 24px' }}>
        <div className="row g-4">
          {/* Mission */}
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
                style={{ color: 'var(--color-rose-accent)' }}
                fill="var(--color-rose-accent)"
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-white)',
                }}
              >
                Haven of Hope
              </span>
            </div>
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: '1.7',
                maxWidth: '320px',
              }}
            >
              Dedicated to helping vulnerable girls find safety, healing, and a
              future full of possibility. Together, we create lasting change.
            </p>
          </div>

          {/* Quick Links */}
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
              Quick Links
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
                { to: '/', label: 'Home' },
                { to: '/donate', label: 'Donate' },
                { to: '/login', label: 'Login' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--color-rose-accent)')
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
          <div className="col-lg-3 col-md-6">
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
                <span>123 Hope Street, City, ST 00000</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ flexShrink: 0 }} />
                <span>hello@havenofhope.org</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} style={{ flexShrink: 0 }} />
                <span>(555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="col-lg-3 col-md-6">
            <h4
              style={{
                color: 'var(--color-white)',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '16px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Follow Us
            </h4>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[Globe, MessageCircle, Camera].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={Icon.displayName || 'Social link'}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)',
                    transition:
                      'background-color var(--transition-fast), color var(--transition-fast)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--color-rose-accent)';
                    e.currentTarget.style.color = 'var(--color-white)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  <Icon size={18} />
                </a>
              ))}
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
        &copy; {new Date().getFullYear()} Haven of Hope. All rights reserved.
      </div>
    </footer>
  );
}

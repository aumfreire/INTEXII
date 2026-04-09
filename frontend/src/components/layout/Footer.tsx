import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer
            style={{
                backgroundColor: 'var(--color-dark)',
                color: 'rgba(255,255,255,0.72)',
                padding: '20px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <div className="container" style={{ padding: '0 24px' }}>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                    }}
                >
                    <span>© 2026 Haven of Hope. All rights reserved. A registered 501(c)(3) nonprofit organization.</span>
                    <span aria-hidden="true">|</span>
                    <Link
                        to="/privacy"
                        style={{
                            color: 'rgba(255,255,255,0.78)',
                            textDecoration: 'none',
                        }}
                    >
                        Privacy Policy
                    </Link>
                    <span aria-hidden="true">|</span>
                    <Link
                        to="/cookies"
                        style={{
                            color: 'rgba(255,255,255,0.78)',
                            textDecoration: 'none',
                        }}
                    >
                        Cookie Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
}

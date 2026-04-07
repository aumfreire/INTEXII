import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  light?: boolean;
}

export default function SecondaryButton({
  children,
  onClick,
  href,
  type = 'button',
  disabled = false,
  className = '',
  fullWidth = false,
  light = false,
}: SecondaryButtonProps) {
  const baseClass = `btn-secondary-cta ${fullWidth ? 'w-100' : ''} ${className}`.trim();

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 28px',
    backgroundColor: 'transparent',
    color: light ? 'var(--color-cream)' : 'var(--color-primary-dark)',
    border: `2px solid ${light ? 'var(--color-cream)' : 'var(--color-primary-dark)'}`,
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: 'background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
    textDecoration: 'none',
    lineHeight: '1.5',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      if (light) {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      } else {
        e.currentTarget.style.backgroundColor = 'rgba(193, 96, 58, 0.08)';
      }
      e.currentTarget.style.transform = 'translateY(-1px)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  if (href) {
    return (
      <Link
        to={href}
        className={baseClass}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={baseClass}
      style={style}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}

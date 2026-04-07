import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  loading?: boolean;
}

export default function PrimaryButton({
  children,
  onClick,
  href,
  type = 'button',
  disabled = false,
  className = '',
  fullWidth = false,
  loading = false,
}: PrimaryButtonProps) {
  const baseClass = `btn-primary-cta ${fullWidth ? 'w-100' : ''} ${className}`.trim();

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 28px',
    backgroundColor: 'var(--color-cta)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.7 : 1,
    transition: 'background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
    textDecoration: 'none',
    lineHeight: '1.5',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.backgroundColor = 'var(--color-cta-hover)';
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-cta)';
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const content = (
    <>
      {loading && <Loader2 size={18} className="spin-icon" />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={baseClass}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={baseClass}
      style={style}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {content}
    </button>
  );
}

import { type ReactNode } from 'react';

interface CardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
  accentColor?: string;
}

export default function Card({
  icon,
  title,
  description,
  className = '',
  accentColor,
}: CardProps) {
  return (
    <div
      className={`h-100 ${className}`}
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-md)',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)',
        borderTop: accentColor ? `4px solid ${accentColor}` : undefined,
        transition:
          'transform var(--transition-normal), box-shadow var(--transition-normal)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {icon && (
        <div style={{ marginBottom: '16px', color: 'var(--color-lavender)' }}>
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '1.2rem',
          marginBottom: '10px',
          color: 'var(--color-charcoal)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--color-muted)',
          fontSize: '0.95rem',
          lineHeight: '1.65',
          marginBottom: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
}

export default function TestimonialCard({
  quote,
  name,
  role,
}: TestimonialCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="h-100"
      style={{
        backgroundColor: 'var(--color-warm-cream)',
        borderRadius: 'var(--radius-md)',
        padding: '28px',
        position: 'relative',
      }}
    >
      <Quote
        size={28}
        style={{
          color: 'var(--color-rose-accent)',
          marginBottom: '12px',
          opacity: 0.7,
        }}
      />
      <p
        style={{
          fontStyle: 'italic',
          color: 'var(--color-charcoal)',
          fontSize: '1rem',
          lineHeight: '1.7',
          marginBottom: '20px',
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-lavender)',
            color: 'var(--color-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div>
          <p
            style={{
              fontWeight: 600,
              marginBottom: '2px',
              color: 'var(--color-charcoal)',
              fontSize: '0.95rem',
            }}
          >
            {name}
          </p>
          {role && (
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: '0.85rem',
                marginBottom: 0,
              }}
            >
              {role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

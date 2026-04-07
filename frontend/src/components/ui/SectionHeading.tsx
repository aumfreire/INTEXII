interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  label?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionHeading({
  title,
  subtitle,
  label,
  centered = true,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={`mb-4 ${centered ? 'text-center' : ''}`}>
      {label && (
        <p
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: light ? 'var(--color-primary-light)' : 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          {label}
        </p>
      )}
      <h2
        style={{
          color: light ? 'var(--color-white)' : 'var(--color-dark)',
          marginBottom: '12px',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: '50px',
          height: '3px',
          backgroundColor: light
            ? 'var(--color-primary-light)'
            : 'var(--color-primary)',
          margin: centered ? '0 auto 16px' : '0 0 16px',
          borderRadius: '2px',
        }}
      />
      {subtitle && (
        <p
          style={{
            color: light ? 'rgba(255,255,255,0.85)' : 'var(--color-muted)',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: centered ? '0 auto' : '0',
            lineHeight: '1.7',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

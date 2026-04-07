import { Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning';
  onClose?: () => void;
}

const config = {
  info: {
    bg: 'rgba(193, 96, 58, 0.08)',
    border: 'var(--color-primary-light)',
    icon: Info,
  },
  success: {
    bg: 'rgba(122, 158, 126, 0.12)',
    border: 'var(--color-sage)',
    icon: CheckCircle,
  },
  warning: {
    bg: 'rgba(193, 96, 58, 0.12)',
    border: 'var(--color-primary)',
    icon: AlertTriangle,
  },
};

export default function AlertBanner({
  message,
  type = 'info',
  onClose,
}: AlertBannerProps) {
  const { bg, border, icon: Icon } = config[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
        fontSize: '0.9rem',
        color: 'var(--color-dark)',
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, color: border }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            color: 'var(--color-muted)',
          }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

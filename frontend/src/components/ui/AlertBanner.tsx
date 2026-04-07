import { Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning';
  onClose?: () => void;
}

const config = {
  info: {
    bg: 'rgba(153, 183, 198, 0.15)',
    border: 'var(--color-soft-blue)',
    icon: Info,
  },
  success: {
    bg: 'rgba(154, 180, 157, 0.15)',
    border: 'var(--color-sage-green)',
    icon: CheckCircle,
  },
  warning: {
    bg: 'rgba(244, 176, 146, 0.15)',
    border: 'var(--color-peach-accent)',
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
        color: 'var(--color-charcoal)',
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

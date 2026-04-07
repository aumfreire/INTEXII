import { type ChangeEvent, type ReactNode } from 'react';

interface FormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}

export default function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  icon,
  disabled = false,
  children,
}: FormInputProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '0.9rem',
          fontWeight: 500,
          color: 'var(--color-charcoal)',
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--color-cta)', marginLeft: '2px' }}>
            *
          </span>
        )}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{
            width: '100%',
            padding: icon ? '10px 12px 10px 40px' : '10px 12px',
            paddingRight: children ? '44px' : '12px',
            border: `1.5px solid ${error ? 'var(--color-cta)' : 'var(--color-light-gray)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-charcoal)',
            backgroundColor: disabled
              ? 'var(--color-light-gray)'
              : 'var(--color-white)',
            transition:
              'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            outline: 'none',
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-lavender)';
              e.currentTarget.style.boxShadow =
                '0 0 0 3px rgba(151, 142, 196, 0.2)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-light-gray)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
        {children && (
          <span
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {children}
          </span>
        )}
      </div>
      {error && (
        <span
          style={{
            display: 'block',
            marginTop: '4px',
            fontSize: '0.82rem',
            color: 'var(--color-cta)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

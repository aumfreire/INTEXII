import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            style={{
              borderBottom: '1px solid var(--color-light-gray)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '1.05rem',
                fontWeight: 500,
                color: 'var(--color-charcoal)',
                textAlign: 'left',
              }}
            >
              <span>{item.question}</span>
              <ChevronDown
                size={20}
                style={{
                  transition: 'transform var(--transition-normal)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                  marginLeft: '12px',
                  color: 'var(--color-muted)',
                }}
              />
            </button>
            <div
              style={{
                maxHeight: isOpen ? '500px' : '0',
                transition: 'max-height var(--transition-normal), opacity var(--transition-normal)',
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
              }}
            >
              <p
                style={{
                  paddingBottom: '18px',
                  color: 'var(--color-muted)',
                  lineHeight: '1.7',
                  fontSize: '0.95rem',
                  marginBottom: 0,
                }}
              >
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

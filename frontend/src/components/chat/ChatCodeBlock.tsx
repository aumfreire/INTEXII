import { useState } from 'react';

interface ChatCodeBlockProps {
  className?: string;
  children: string;
}

export default function ChatCodeBlock({ className, children }: ChatCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') ?? 'code';

  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="chat-code-block-wrap">
      <div className="chat-code-block-head">
        <span>{language}</span>
        <button type="button" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

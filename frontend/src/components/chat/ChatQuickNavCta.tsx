import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ChatMessage } from '../../types/chat';

const donateIntent =
  /\b(donate|donation|donating|give\s+money|make\s+a\s+gift|contribute|financial\s+support|where\s+can\s+i\s+give|how\s+(can|do)\s+i\s+donate|want\s+to\s+donate|support\s+haven)\b/i;

const loginIntent =
  /\b(log\s*in|login|sign\s*in|signin|where\s+(can|do)\s+i\s+log\s*in|how\s+(can|do)\s+i\s+log\s*in|access\s+(my\s+)?account|sign\s+on)\b/i;

const signupIntent =
  /\b(sign\s*up|signup|register|create\s+(an?\s+)?account|new\s+account|where\s+(can|do)\s+i\s+sign\s*up|how\s+(can|do)\s+i\s+register)\b/i;

interface ChatQuickNavCtaProps {
  messages: ChatMessage[];
}

export default function ChatQuickNavCta({ messages }: ChatQuickNavCtaProps) {
  const { showDonate, showLogin, showSignup } = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const text = lastUser?.content?.trim() ?? '';
    if (!text) {
      return { showDonate: false, showLogin: false, showSignup: false };
    }
    return {
      showDonate: donateIntent.test(text),
      showLogin: loginIntent.test(text),
      showSignup: signupIntent.test(text),
    };
  }, [messages]);

  if (!showDonate && !showLogin && !showSignup) {
    return null;
  }

  return (
    <div className="chat-quick-nav-cta" role="region" aria-label="Quick links">
      {showLogin ? (
        <section className="chat-quick-nav-block">
          <p className="chat-quick-nav-text">You can sign in on our log in page.</p>
          <Link to="/login" className="chat-quick-nav-link">
            Go to log in
          </Link>
        </section>
      ) : null}
      {showSignup ? (
        <section className="chat-quick-nav-block">
          <p className="chat-quick-nav-text">Create an account to get started.</p>
          <Link to="/signup" className="chat-quick-nav-link">
            Create an account
          </Link>
        </section>
      ) : null}
      {showDonate ? (
        <section className="chat-quick-nav-block">
          <p className="chat-quick-nav-text">Want to donate? Your support means a lot.</p>
          <Link to="/donate" className="chat-quick-nav-link">
            Go to our donate page
          </Link>
        </section>
      ) : null}
    </div>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ChatMessage } from '../../types/chat';

const donateIntent =
  /\b(donate|donation|donating|give\s+money|make\s+a\s+gift|contribute|financial\s+support|where\s+can\s+i\s+give|how\s+(can|do)\s+i\s+donate|want\s+to\s+donate|support\s+haven)\b/i;

const loginIntent =
  /\b(log\s*in|login|sign\s*in|signin|where\s+(can|do)\s+i\s+log\s*in|how\s+(can|do)\s+i\s+log\s*in|access\s+(my\s+)?account|sign\s+on)\b/i;

const signupIntent =
  /\b(sign\s*up|signup|register|create\s+(an?\s+)?account|new\s+account|where\s+(can|do)\s+i\s+sign\s*up|how\s+(can|do)\s+i\s+register)\b/i;

/** Match backend TryGetPublicCannedResponse: IT-style wording on public chat → show log in. */
const internalFlavored =
  /\b(data\s+synchroniz|synchronization|user\s+permissions|permissions\s+(are|set)|data\s+visibility|authentication\s+systems?|database\s+context|internal\s+(assistant|systems?)|operational\s+access|system\s+administrator|it\s+support|verify\s+if)\b/i;
const soundsStuck =
  /\b(access|account|login|log\s*in|sign\s*in|interface|dashboard|trying\s+to|issues?|unable|can't|cannot)\b/i;

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
    const techAccess =
      text.length <= 520 && internalFlavored.test(text) && soundsStuck.test(text);
    const authDetails = /\b(credentials?|authentication)\b/i.test(text);
    const visitorAccess = /\b(log\s*in|login|sign\s*in|account|access|sign\s+on)\b/i.test(text);
    return {
      showDonate: donateIntent.test(text),
      showLogin: loginIntent.test(text) || techAccess || (authDetails && visitorAccess),
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

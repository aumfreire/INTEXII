import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react';
import { Maximize2, MessageCircle, Minimize2, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import '../styles/components/chat-widget.css';

type ChatRole = 'user' | 'assistant';

interface ChatSource {
  title: string;
  route: string;
  snippet: string;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  sources?: ChatSource[];
  followUpPrompts?: string[];
}

const CHAT_ENDPOINT = '/api/chat/widget';
const AUTH_TOKEN_STORAGE_KEY = 'intex-auth-token-v1';

function stripMarkdownArtifacts(text: string): string {
  // Remove leftover emphasis markers when the model returns malformed markdown.
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/\*([^*\s][^*]*?)\*/g, '$1')
    .replace(/_([^_\s][^_]*?)_/g, '$1');
}

function isInternalRoute(url: string): boolean {
  if (url.startsWith('/')) {
    return !url.startsWith('//');
  }

  return url.startsWith('#');
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let linkMatch: RegExpExecArray | null;
  let cursor = 0;

  const pushBoldText = (plain: string, subKeyPrefix: string) => {
    const cleanedPlain = stripMarkdownArtifacts(plain);
    const boldRegex = /\*\*(.+?)\*\*/g;
    let boldMatch: RegExpExecArray | null;
    let boldCursor = 0;
    let boldIndex = 0;

    while ((boldMatch = boldRegex.exec(cleanedPlain)) !== null) {
      const before = cleanedPlain.slice(boldCursor, boldMatch.index);
      if (before) {
        parts.push(
          <Fragment key={`${subKeyPrefix}-text-${boldIndex}`}>{before}</Fragment>
        );
      }
      parts.push(
        <strong key={`${subKeyPrefix}-bold-${boldIndex}`}>{boldMatch[1]}</strong>
      );
      boldCursor = boldMatch.index + boldMatch[0].length;
      boldIndex++;
    }

    const trailing = cleanedPlain.slice(boldCursor);
    if (trailing) {
      parts.push(
        <Fragment key={`${subKeyPrefix}-tail-${boldIndex}`}>{trailing}</Fragment>
      );
    }
  };

  let linkIndex = 0;
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    const before = text.slice(cursor, linkMatch.index);
    if (before) {
      pushBoldText(before, `${keyPrefix}-before-${linkIndex}`);
    }

    const target = linkMatch[2].trim();
    if (isInternalRoute(target)) {
      parts.push(
        <Link key={`${keyPrefix}-link-${linkIndex}`} to={target}>
          {linkMatch[1]}
        </Link>
      );
    } else {
      // Never render outbound links from assistant markdown.
      parts.push(
        <Fragment key={`${keyPrefix}-external-${linkIndex}`}>{linkMatch[1]}</Fragment>
      );
    }

    cursor = linkMatch.index + linkMatch[0].length;
    linkIndex++;
  }

  const remainder = text.slice(cursor);
  if (remainder) {
    pushBoldText(remainder, `${keyPrefix}-remainder`);
  }

  return parts;
}

function renderMessageMarkdown(text: string): ReactNode {
  const lines = stripMarkdownArtifacts(text).split('\n');
  const rendered: ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      rendered.push(<div key={`spacer-${index}`} className="chat-widget-line-spacer" />);
      return;
    }

    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      rendered.push(
        <div key={`h-${index}`} className="chat-widget-md-heading">
          {renderInlineMarkdown(headingMatch[1], `h-inline-${index}`)}
        </div>
      );
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      rendered.push(
        <div key={`li-${index}`} className="chat-widget-md-bullet">
          <span className="chat-widget-md-bullet-dot">•</span>
          <span>{renderInlineMarkdown(bulletMatch[1], `li-inline-${index}`)}</span>
        </div>
      );
      return;
    }

    rendered.push(
      <div key={`p-${index}`} className="chat-widget-md-paragraph">
        {renderInlineMarkdown(line, `p-inline-${index}`)}
      </div>
    );
  });

  return rendered;
}

function getWelcomeMessage(isAdmin: boolean): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: isAdmin
      ? 'Admin mode enabled. I can answer with live internal metrics and operational insights.'
      : 'Hi! I can help with Haven of Hope questions, donations, and ways to get involved.',
  };
}

export default function ChatWidget() {
  const { isAuthenticated, authSession } = useAuth();
  const isAdmin = authSession.roles.includes('Admin');
  const modeKey = `${isAuthenticated ? 'auth' : 'anon'}:${isAdmin ? 'admin' : 'public'}:${authSession.email ?? ''}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(isAdmin)]);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([getWelcomeMessage(isAdmin)]);
    setInput('');
    setError(null);
    setIsLoading(false);
    setIsExpanded(false);
  }, [modeKey, isAdmin]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const authToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || 'Anthropic request failed.');
      }

      const data = (await response.json()) as {
        answer?: string;
        sources?: ChatSource[];
        followUpPrompts?: string[];
      };

      const assistantText =
        data.answer?.trim() ||
        'I could not generate a response right now. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: assistantText,
          sources: Array.isArray(data.sources) ? data.sources : [],
          followUpPrompts: Array.isArray(data.followUpPrompts)
            ? data.followUpPrompts.filter((p): p is string => typeof p === 'string').slice(0, 3)
            : [],
        },
      ]);
      window.setTimeout(() => {
        listRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 20);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to reach the chat service right now.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void sendMessage();
    }
  }

  function useFollowUpPrompt(prompt: string) {
    setInput(prompt);
    window.setTimeout(() => {
      void sendMessage();
    }, 0);
  }

  return (
    <div className="chat-widget-root" aria-live="polite">
      {isOpen ? (
        <section
          className={`chat-widget-panel ${isExpanded ? 'chat-widget-panel-expanded' : ''}`}
          role="dialog"
          aria-label="AI assistant chat"
        >
          <header className="chat-widget-header">
            <div className="chat-widget-title">
              Haven Assistant
            </div>
            <div className="chat-widget-header-actions">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="chat-widget-icon-btn"
                aria-label={isExpanded ? 'Collapse chat window' : 'Expand chat window'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="chat-widget-icon-btn"
                aria-label="Close chat"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="chat-widget-messages" ref={listRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-widget-bubble ${
                  message.role === 'user' ? 'chat-widget-bubble-user' : 'chat-widget-bubble-assistant'
                }`}
              >
                {renderMessageMarkdown(message.text)}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 ? (
                  <div className="chat-widget-sources">
                    {message.sources.map((source, index) => (
                      <Link key={`${source.route}-${index}`} to={source.route}>
                        {source.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
                {message.role === 'assistant' &&
                message.followUpPrompts &&
                message.followUpPrompts.length > 0 ? (
                  <div className="chat-widget-followups">
                    {message.followUpPrompts.map((prompt, index) => (
                      <button
                        key={`${message.id}-followup-${index}`}
                        type="button"
                        onClick={() => useFollowUpPrompt(prompt)}
                        disabled={isLoading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {isLoading ? (
              <div className="chat-widget-bubble chat-widget-bubble-assistant">
                <div className="chat-widget-typing" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}

            {error ? <div className="chat-widget-error">{error}</div> : null}
          </div>

          <footer className="chat-widget-input-wrap">
            <input
              type="text"
              placeholder="Ask about donations, impact, or how to help..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-widget-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI chat assistant"
      >
        <MessageCircle size={18} />
      </button>
    </div>
  );
}

import { useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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
}

const CHAT_ENDPOINT = '/api/chat/widget';
const AUTH_TOKEN_STORAGE_KEY = 'intex-auth-token-v1';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help with Haven of Hope questions, donations, and ways to get involved.',
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

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
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to reach the chat service right now.'
      );
    } finally {
      setIsLoading(false);
      window.setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 20);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="chat-widget-root" aria-live="polite">
      {isOpen ? (
        <section className="chat-widget-panel" role="dialog" aria-label="AI assistant chat">
          <header className="chat-widget-header">
            <div className="chat-widget-title">
              Haven Assistant
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="chat-widget-icon-btn"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </header>

          <div className="chat-widget-messages" ref={listRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-widget-bubble ${
                  message.role === 'user' ? 'chat-widget-bubble-user' : 'chat-widget-bubble-assistant'
                }`}
              >
                {message.text}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 ? (
                  <div className="chat-widget-sources">
                    {message.sources.map((source, index) => (
                      <Link key={`${source.route}-${index}`} to={source.route}>
                        {source.title}
                      </Link>
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
        <span>Chat</span>
      </button>
    </div>
  );
}

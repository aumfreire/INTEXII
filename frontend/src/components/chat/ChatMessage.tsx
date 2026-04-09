import { Copy } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage as ChatMessageType } from '../../types/chat';
import ChatFeedbackButtons from './ChatFeedbackButtons';
import ChatMarkdownRenderer from './ChatMarkdownRenderer';
import ChatLoadingIndicator from './ChatLoadingIndicator';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
  }

  const date = new Date(message.createdAt);
  const exactTimestamp = Number.isNaN(date.getTime()) ? message.createdAt : format(date, 'PPpp');
  const shortTimestamp = Number.isNaN(date.getTime()) ? '' : format(date, 'p');

  return (
    <article className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}>
      {message.role === 'assistant' ? <div className="chat-avatar">HH</div> : null}
      <div className="chat-message-card">
        {message.pending && !message.content ? <ChatLoadingIndicator /> : <ChatMarkdownRenderer content={message.content} />}
        <div className="chat-message-footer">
          <span title={exactTimestamp}>{shortTimestamp}</span>
          <button type="button" onClick={() => void copyMessage()} aria-label="Copy response">
            <Copy size={14} />
          </button>
          {message.role === 'assistant' ? <ChatFeedbackButtons messageId={message.messageId} /> : null}
        </div>
      </div>
    </article>
  );
}

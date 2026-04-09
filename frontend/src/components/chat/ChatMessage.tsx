import { format } from 'date-fns';
import type { ChatMessage as ChatMessageType } from '../../types/chat';
import ChatFeedbackButtons from './ChatFeedbackButtons';
import ChatMarkdownRenderer from './ChatMarkdownRenderer';
import ChatLoadingIndicator from './ChatLoadingIndicator';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
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
          {message.role === 'assistant' ? <ChatFeedbackButtons messageId={message.messageId} /> : null}
        </div>
      </div>
    </article>
  );
}

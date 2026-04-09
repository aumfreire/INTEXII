import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import ChatMessageItem from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="chat-message-list">
      {messages.map((message, index) => (
        <ChatMessageItem
          key={`${message.messageId ?? 'temp'}-${index}-${message.createdAt}`}
          message={message}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}

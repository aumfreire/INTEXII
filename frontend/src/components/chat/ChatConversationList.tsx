import { formatDistanceToNow } from 'date-fns';
import type { ChatConversationSummary } from '../../types/chat';

interface ChatConversationListProps {
  conversations: ChatConversationSummary[];
  activeConversationId?: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
}

export default function ChatConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onRename,
}: ChatConversationListProps) {
  return (
    <div className="chat-conversation-list">
      {conversations.map((conversation) => (
        <button
          key={conversation.conversationId}
          type="button"
          className={`chat-conversation-item ${
            activeConversationId === conversation.conversationId ? 'active' : ''
          }`}
          onClick={() => onSelect(conversation.conversationId)}
        >
          <div className="chat-conversation-title">{conversation.title || 'Untitled'}</div>
          <div className="chat-conversation-meta">
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
          </div>
          <span
            role="button"
            tabIndex={0}
            className="chat-conversation-delete"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(conversation.conversationId);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                onDelete(conversation.conversationId);
              }
            }}
          >
            Delete
          </span>
          <span
            role="button"
            tabIndex={0}
            className="chat-conversation-delete"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const nextTitle = window.prompt('Rename conversation', conversation.title || 'Untitled');
              if (nextTitle && nextTitle.trim()) {
                onRename(conversation.conversationId, nextTitle.trim());
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                const nextTitle = window.prompt('Rename conversation', conversation.title || 'Untitled');
                if (nextTitle && nextTitle.trim()) {
                  onRename(conversation.conversationId, nextTitle.trim());
                }
              }
            }}
            style={{ marginLeft: 10 }}
          >
            Rename
          </span>
        </button>
      ))}
    </div>
  );
}

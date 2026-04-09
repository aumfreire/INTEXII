import ChatConversationList from './ChatConversationList';
import type { ChatConversationSummary } from '../../types/chat';

interface ChatSidebarProps {
  conversations: ChatConversationSummary[];
  activeConversationId?: number;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onRenameConversation: (id: number, title: string) => void;
}

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: ChatSidebarProps) {
  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-title">Haven Assistant</div>
      <button type="button" className="chat-new-btn" onClick={onNewChat}>
        New chat
      </button>
      <ChatConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
        onDelete={onDeleteConversation}
        onRename={onRenameConversation}
      />
    </aside>
  );
}

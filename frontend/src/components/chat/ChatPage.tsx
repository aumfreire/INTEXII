import { useEffect, useState } from 'react';
import { Maximize2, Minimize2, Moon, PanelLeft, Sun } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useChat } from '../../hooks/useChat';
import ChatEmptyState from './ChatEmptyState';
import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';
import ChatSidebar from './ChatSidebar';
import '../../styles/components/chat-page.css';

/** Set true to show history sidebar + toggle again */
const conversationSidebarEnabled = false;

interface ChatPageProps {
  adminMode: boolean;
  popupMode?: boolean;
  showFullscreenToggle?: boolean;
}

export default function ChatPage({
  adminMode,
  popupMode = false,
  showFullscreenToggle = true,
}: ChatPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAuthenticated, authSession } = useAuth();
  const {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    canSend,
    conversationId,
    history,
    files,
    send,
    startNewChat,
    loadConversation,
  } = useChat(adminMode);

  useEffect(() => {
    if (adminMode && isAuthenticated) {
      void history.refresh();
    }
  }, [adminMode, history, isAuthenticated]);

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = '';
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  const canUseAdmin = isAuthenticated && authSession.roles.includes('Admin');
  const sidebarVisible = adminMode && conversationSidebarEnabled && sidebarOpen;

  return (
    <section className={`chat-page ${popupMode ? 'chat-page-popup' : ''} ${darkMode ? 'chat-theme-dark' : 'chat-theme-light'} ${isFullscreen ? 'chat-fullscreen' : 'chat-windowed'}`}>
      <div className={`chat-shell ${sidebarVisible ? '' : 'chat-shell-single'}`}>
        {sidebarVisible ? (
          <ChatSidebar
            conversations={history.conversations}
            activeConversationId={conversationId}
            onNewChat={() => void startNewChat()}
            onSelectConversation={(id) => void loadConversation(id)}
            onDeleteConversation={(id) => void history.remove(id)}
            onRenameConversation={(id, title) => void history.rename(id, title)}
          />
        ) : null}
        <div className="chat-main">
          <div className="chat-main-topbar">
            {adminMode && conversationSidebarEnabled ? (
              <button type="button" className="chat-topbar-btn" onClick={() => setSidebarOpen((prev) => !prev)}>
                <PanelLeft size={15} />
                {sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              </button>
            ) : (
              <span />
            )}
            <div className="chat-topbar-actions">
              <button type="button" className="chat-topbar-btn" onClick={() => setDarkMode((prev) => !prev)}>
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                {darkMode ? 'Light mode' : 'Dark mode'}
              </button>
              {showFullscreenToggle ? (
                <button type="button" className="chat-topbar-btn" onClick={() => setIsFullscreen((prev) => !prev)}>
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  {isFullscreen ? 'Downsize' : 'Fullscreen'}
                </button>
              ) : null}
            </div>
          </div>
          {!adminMode || canUseAdmin ? (
            <>
              <div className="chat-main-scroll">
                {messages.length === 0 ? <ChatEmptyState /> : <ChatMessageList messages={messages} />}
              </div>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => void send()}
                canSend={canSend}
                isStreaming={isStreaming}
                attachments={files.attachments}
                onFilesAdded={files.addFiles}
                onRemoveAttachment={files.removeFile}
                accept={files.accept}
              />
              {error ? <div className="chat-error">{error}</div> : null}
            </>
          ) : (
            <div className="chat-error">Admin access is required for this chat route.</div>
          )}
        </div>
      </div>
    </section>
  );
}

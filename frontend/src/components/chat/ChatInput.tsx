import { useLayoutEffect, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import ChatFilePreview from './ChatFilePreview';
import type { ChatAttachment } from '../../types/chat';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  canSend: boolean;
  isStreaming: boolean;
  attachments: ChatAttachment[];
  onFilesAdded: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  accept: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  canSend,
  isStreaming,
  attachments,
  onFilesAdded,
  onRemoveAttachment,
  accept,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  /** Match CSS max-height so JS cap aligns with scroll + padding */
  const textareaMaxPx = 260;

  const { getRootProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: onFilesAdded,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend || isStreaming) {
      return;
    }
    onSend();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!canSend || isStreaming) {
        return;
      }
      onSend();
    }
  }

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, textareaMaxPx)}px`;
  }, [value, isStreaming]);

  return (
    <div className={`chat-input-wrap ${isDragActive ? 'chat-drop-active' : ''}`} {...getRootProps()}>
      <ChatFilePreview attachments={attachments} onRemove={onRemoveAttachment} />
      <div className="chat-input-mode">Haven Chat</div>
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <button
          type="button"
          className="chat-input-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          aria-label="Attach files"
        >
          <Paperclip size={18} />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask me anything"
          disabled={isStreaming}
        />
        <button
          type="submit"
          className="chat-input-send-btn"
          disabled={!canSend || isStreaming}
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </form>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(event) => onFilesAdded(Array.from(event.target.files ?? []))}
        style={{ display: 'none' }}
      />
    </div>
  );
}

import type { ChatAttachment } from '../../types/chat';

interface ChatFilePreviewProps {
  attachments: ChatAttachment[];
  onRemove: (index: number) => void;
}

export default function ChatFilePreview({ attachments, onRemove }: ChatFilePreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="chat-file-preview-list">
      {attachments.map((attachment, index) => (
        <div key={`${attachment.fileName}-${index}`} className="chat-file-preview-item">
          {attachment.previewUrl ? (
            <img src={attachment.previewUrl} alt={attachment.fileName} />
          ) : (
            <div className="chat-file-preview-generic">{attachment.fileName.split('.').pop()?.toUpperCase()}</div>
          )}
          <div className="chat-file-preview-name">{attachment.fileName}</div>
          <button type="button" onClick={() => onRemove(index)} aria-label="Remove attachment">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

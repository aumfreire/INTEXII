import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { sendFeedback } from '../../services/chatApi';

interface ChatFeedbackButtonsProps {
  messageId?: number;
}

export default function ChatFeedbackButtons({ messageId }: ChatFeedbackButtonsProps) {
  if (!messageId) return null;

  async function submit(rating: 'up' | 'down') {
    if (!messageId) {
      return;
    }
    try {
      await sendFeedback(messageId, rating);
    } catch {
      // silent: feedback should not interrupt chat
    }
  }

  return (
    <div className="chat-feedback-buttons">
      <button type="button" aria-label="Thumbs up" onClick={() => void submit('up')}>
        <ThumbsUp size={14} />
      </button>
      <button type="button" aria-label="Thumbs down" onClick={() => void submit('down')}>
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}

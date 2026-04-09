export type ChatRole = 'user' | 'assistant';

export interface ChatAttachment {
  uploadId?: number;
  file?: File;
  fileName: string;
  contentType: string;
  previewUrl?: string;
}

export interface ChatMessage {
  messageId?: number;
  role: ChatRole;
  content: string;
  createdAt: string;
  pending?: boolean;
}

export interface ChatConversationSummary {
  conversationId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationDetail {
  conversation: ChatConversationSummary;
  messages: ChatMessage[];
}

export interface ChatStreamRequest {
  conversationId?: number;
  message: string;
  externalContext?: string;
  attachmentUploadIds?: number[];
  /** When true, server may attach DB summaries (admins only; Admin chat page). */
  includeInternalContext?: boolean;
}

export interface StreamHandlers {
  onDelta: (delta: string) => void;
  onDone: (meta: { conversationId?: number }) => void;
}

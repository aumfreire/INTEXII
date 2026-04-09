import { useCallback, useMemo, useState } from 'react';
import { uploadAttachment } from '../services/chatApi';
import type { ChatMessage } from '../types/chat';
import { useChatHistory } from './useChatHistory';
import { useChatStream } from './useChatStream';
import { useFileUpload } from './useFileUpload';

export function useChat(adminMode: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const history = useChatHistory();
  const files = useFileUpload();
  const { runStream } = useChatStream();

  const startNewChat = useCallback(async () => {
    setMessages([]);
    setError(null);
    files.clearFiles();
    if (!adminMode) {
      setConversationId(undefined);
      return;
    }

    const created = await history.create();
    setConversationId(created.conversationId);
  }, [adminMode, files, history]);

  const loadConversation = useCallback(
    async (id: number) => {
      const detail = await history.loadConversation(id);
      setConversationId(detail.conversation.conversationId);
      setMessages(detail.messages);
    },
    [history]
  );

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed && files.attachments.length === 0) return;

    setError(null);
    setIsStreaming(true);
    let activeConversationId = conversationId;
    try {
      if (adminMode && !activeConversationId) {
        const created = await history.create();
        activeConversationId = created.conversationId;
        setConversationId(created.conversationId);
      }

      const uploadIds: number[] = [];
      if (adminMode && activeConversationId && files.attachments.length > 0) {
        for (const attachment of files.attachments) {
          if (!attachment.file) continue;
          const uploaded = await uploadAttachment(activeConversationId, attachment.file);
          uploadIds.push(uploaded.uploadId);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);

      const result = await runStream(
        {
          conversationId: activeConversationId,
          message: trimmed,
          attachmentUploadIds: uploadIds,
        },
        setMessages
      );

      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }

      setInput('');
      files.clearFiles();
      if (adminMode) {
        await history.refresh();
      }
    } catch (streamError) {
      setError(streamError instanceof Error ? streamError.message : 'Failed to send message.');
    } finally {
      setIsStreaming(false);
    }
  }, [adminMode, conversationId, files, history, input, runStream]);

  const retryLast = useCallback(async () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUser || isStreaming) {
      return;
    }
    setInput(lastUser.content);
    window.setTimeout(() => {
      void send();
    }, 0);
  }, [isStreaming, messages, send]);

  const canSend = useMemo(() => input.trim().length > 0 || files.attachments.length > 0, [files.attachments.length, input]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isStreaming,
    error,
    conversationId,
    canSend,
    history,
    files,
    send,
    retryLast,
    startNewChat,
    loadConversation,
  };
}

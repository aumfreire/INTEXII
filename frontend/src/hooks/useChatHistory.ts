import { useCallback, useState } from 'react';
import type { ChatConversationDetail, ChatConversationSummary } from '../types/chat';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  renameConversation,
} from '../services/chatApi';

export function useChatHistory() {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const result = await listConversations();
      setConversations(result);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const create = useCallback(async () => {
    const created = await createConversation('New conversation');
    setConversations((prev) => [created, ...prev]);
    return created;
  }, []);

  const loadConversation = useCallback(async (id: number): Promise<ChatConversationDetail> => {
    return getConversation(id);
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((conversation) => conversation.conversationId !== id));
  }, []);

  const rename = useCallback(async (id: number, title: string) => {
    const updated = await renameConversation(id, title);
    setConversations((prev) =>
      prev.map((conversation) => (conversation.conversationId === id ? updated : conversation))
    );
  }, []);

  return {
    conversations,
    isLoadingHistory,
    refresh,
    create,
    loadConversation,
    remove,
    rename,
  };
}

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatMessage, ChatStreamRequest } from '../types/chat';
import { streamMessage } from '../services/chatApi';

export function useChatStream() {
  const runStream = useCallback(
    async (
      payload: ChatStreamRequest,
      setMessages: Dispatch<SetStateAction<ChatMessage[]>>
    ): Promise<{ conversationId?: number }> => {
      const assistantPlaceholder: ChatMessage = {
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);
      let resolvedConversationId: number | undefined;

      await streamMessage(payload, {
        onDelta: (delta) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = {
                ...last,
                content: `${last.content}${delta}`,
              };
            }
            return next;
          });
        },
        onDone: ({ conversationId }) => {
          resolvedConversationId = conversationId;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = {
                ...last,
                pending: false,
              };
            }
            return next;
          });
        },
      });

      return { conversationId: resolvedConversationId };
    },
    []
  );

  return { runStream };
}

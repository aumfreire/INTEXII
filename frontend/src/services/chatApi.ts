import type {
  ChatConversationDetail,
  ChatConversationSummary,
  ChatStreamRequest,
  StreamHandlers,
} from '../types/chat';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalBrowser =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const apiBaseUrl =
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl.replace(/\/$/, '')
    : isLocalBrowser
      ? ''
      : 'https://intexii-backend.azurewebsites.net';
const authTokenStorageKey = 'intex-auth-token-v1';

function createHeaders(headers?: HeadersInit): Headers {
  const resolved = new Headers(headers);
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(authTokenStorageKey) : null;
  if (token) {
    resolved.set('Authorization', `Bearer ${token}`);
  }
  return resolved;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers: createHeaders(init?.headers),
  });
}

export async function createConversation(title?: string): Promise<ChatConversationSummary> {
  const response = await apiFetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Unable to create conversation.');
  return response.json();
}

export async function listConversations(): Promise<ChatConversationSummary[]> {
  const response = await apiFetch('/api/chat/conversations');
  if (!response.ok) throw new Error('Unable to load conversations.');
  return response.json();
}

export async function getConversation(id: number): Promise<ChatConversationDetail> {
  const response = await apiFetch(`/api/chat/conversations/${id}`);
  if (!response.ok) throw new Error('Unable to load conversation.');
  return response.json();
}

export async function deleteConversation(id: number): Promise<void> {
  const response = await apiFetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Unable to delete conversation.');
}

export async function renameConversation(id: number, title: string): Promise<ChatConversationSummary> {
  const response = await apiFetch(`/api/chat/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Unable to rename conversation.');
  return response.json();
}

export async function uploadAttachment(conversationId: number, file: File): Promise<{ uploadId: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversationId', String(conversationId));
  const response = await apiFetch('/api/chat/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Unable to upload attachment.');
  return response.json();
}

export async function sendFeedback(messageId: number, rating: 'up' | 'down'): Promise<void> {
  const response = await apiFetch('/api/chat/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, rating }),
  });
  if (!response.ok) throw new Error('Unable to submit feedback.');
}

export async function streamMessage(
  payload: ChatStreamRequest,
  handlers: StreamHandlers
): Promise<void> {
  const response = await apiFetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error('Unable to stream assistant response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = 'message';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) eventName = line.slice('event: '.length).trim();
        if (line.startsWith('data: ')) data += line.slice('data: '.length);
      }
      if (!data) continue;

      try {
        const parsed = JSON.parse(data) as { delta?: string; conversationId?: number };
        if (eventName === 'delta' && parsed.delta) {
          handlers.onDelta(parsed.delta);
        }
        if (eventName === 'done') {
          handlers.onDone({ conversationId: parsed.conversationId });
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

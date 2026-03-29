import { API_BASE_URL } from '@/lib/constants';
import type { ChatRequest, ChatResponse, Conversation, MessageFromApi } from '@/types/chat';

const LOGIN_PATH = '/login';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt_token');
}

function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = LOGIN_PATH;
  }
}

async function fetchWithAuth(url: string): Promise<Response> {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    throw new Error('Not authenticated');
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
    }
    redirectToLogin();
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Access denied');
  }
  return res;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const url = `${API_BASE_URL}/api/${encodeURIComponent(userId)}/conversations`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json() as Promise<Conversation[]>;
}

export async function deleteConversation(
  userId: string,
  conversationId: number
): Promise<void> {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    throw new Error('Not authenticated');
  }
  const url = `${API_BASE_URL}/api/${encodeURIComponent(userId)}/conversations/${conversationId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
    }
    redirectToLogin();
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Access denied');
  }
  if (!res.ok) {
    if (res.status === 404) throw new Error('Conversation not found');
    throw new Error('Failed to delete conversation');
  }
}

export async function getConversationMessages(
  userId: string,
  conversationId: number
): Promise<MessageFromApi[]> {
  const url = `${API_BASE_URL}/api/${encodeURIComponent(userId)}/conversations/${conversationId}/messages`;
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const err = new Error(res.status === 404 ? 'Conversation not found' : 'Failed to load messages') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<MessageFromApi[]>;
}

export async function sendChatMessage(
  userId: string,
  body: ChatRequest
): Promise<ChatResponse> {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}/api/${encodeURIComponent(userId)}/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
    }
    redirectToLogin();
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Access denied');
  }

  if (!res.ok) {
    const text = await res.text();
    let message = 'Something went wrong. Please try again.';
    if (res.status === 400) {
      try {
        const data = JSON.parse(text);
        message = data.detail ?? data.message ?? message;
      } catch {
        message = text || message;
      }
    } else if (res.status === 404) {
      message = 'Conversation not found. Starting a new thread.';
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<ChatResponse>;
}

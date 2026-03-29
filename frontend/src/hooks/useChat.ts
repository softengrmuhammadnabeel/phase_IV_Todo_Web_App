'use client';

import { useState, useCallback, useEffect } from 'react';
import { sendChatMessage, getConversationMessages, getConversations, deleteConversation as deleteConversationApi } from '@/services/chat.service';
import type { ChatMessage } from '@/types/chat';
import type { ChatResponse, Conversation } from '@/types/chat';

const STORAGE_KEY_PREFIX = 'chat_conversation_';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadConversationId(userId: string): number | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

function saveConversationId(userId: string, conversationId: number): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getStorageKey(userId), String(conversationId));
  } catch {
  }
}

function clearConversationId(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch {
  }
}

export interface UseChatOptions {
  userId: string | undefined;
  onResponse?: (response: ChatResponse) => void;
  loadConversationList?: boolean;
}

export interface UseChatResult {
  messages: ChatMessage[];
  loading: boolean;
  loadingMessages: boolean;
  error: string | null;
  conversationId: number | null;
  conversations: Conversation[];
  sendMessage: (message: string) => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  startNewConversation: () => void;
  setCurrentConversationId: (id: number | null) => void;
  refetchConversations: () => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
}

export function useChat({ userId, onResponse, loadConversationList = true }: UseChatOptions): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationIdState] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const setConversationId = useCallback((id: number | null) => {
    setConversationIdState(id);
    if (userId && id !== null) saveConversationId(userId, id);
    else if (userId) clearConversationId(userId);
  }, [userId]);

  // Load stored conversation id on init
  useEffect(() => {
    if (!userId) {
      setConversationIdState(null);
      return;
    }
    const stored = loadConversationId(userId);
    setConversationIdState(stored);
  }, [userId]);

  const refetchConversations = useCallback(async () => {
    if (!loadConversationList || !userId) return;
    try {
      const list = await getConversations(userId);
      setConversations(list);
    } catch {
      setConversations([]);
    }
  }, [userId, loadConversationList]);

  useEffect(() => {
    if (loadConversationList) refetchConversations();
  }, [loadConversationList, refetchConversations]);

  useEffect(() => {
    if (!userId || conversationId === null) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    getConversationMessages(userId, conversationId)
      .then((list) => {
        if (cancelled) return;
        setMessages(
          list.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        );
      })
      .catch((err) => {
        if (cancelled) return;
        if ((err as { status?: number }).status === 404) {
          clearConversationId(userId);
          setConversationIdState(null);
          setMessages([]);
        } else {
          setError((err as Error).message ?? 'Failed to load messages');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, conversationId]);

  const startNewConversation = useCallback(() => {
    if (userId) clearConversationId(userId);
    setConversationIdState(null);
    setMessages([]);
    setError(null);
  }, [userId]);

  const setCurrentConversationId = useCallback((id: number | null) => {
    setConversationIdState(id);
    if (userId) {
      if (id !== null) saveConversationId(userId, id);
      else clearConversationId(userId);
    }
  }, [userId]);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message?.trim();
      if (!trimmed || !userId || loading) return;

      setError(null);
      setLastUserMessage(trimmed);
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setLoading(true);

      try {
        const res = await sendChatMessage(userId, {
          message: trimmed,
          conversation_id: conversationId,
        });
        setConversationIdState(res.conversation_id);
        saveConversationId(userId, res.conversation_id);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.response },
        ]);
        onResponse?.(res);
        await refetchConversations();
      } catch (err) {
        const e = err as Error & { status?: number };
        if (e.status === 404) {
          clearConversationId(userId);
          setConversationIdState(null);
        }
        setError(e.message ?? 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [userId, conversationId, loading, onResponse, refetchConversations]
  );

  const retry = useCallback(async () => {
    if (!lastUserMessage || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await sendChatMessage(userId!, {
        message: lastUserMessage,
        conversation_id: conversationId,
      });
      setConversationIdState(res.conversation_id);
      if (userId) saveConversationId(userId, res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.response },
      ]);
      onResponse?.(res);
      await refetchConversations();
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 404 && userId) {
        clearConversationId(userId);
        setConversationIdState(null);
      }
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lastUserMessage, userId, conversationId, loading, onResponse, refetchConversations]);

  const clearError = useCallback(() => setError(null), []);

  const deleteConversation = useCallback(
    async (convId: number) => {
      if (!userId) return;
      try {
        await deleteConversationApi(userId, convId);
        if (conversationId === convId) {
          clearConversationId(userId);
          setConversationIdState(null);
          setMessages([]);
        }
        await refetchConversations();
      } catch {
        setError('Failed to delete conversation');
      }
    },
    [userId, conversationId, refetchConversations]
  );

  return {
    messages,
    loading,
    loadingMessages,
    error,
    conversationId,
    conversations,
    sendMessage,
    retry,
    clearError,
    startNewConversation,
    setCurrentConversationId,
    refetchConversations,
    deleteConversation,
  };
}

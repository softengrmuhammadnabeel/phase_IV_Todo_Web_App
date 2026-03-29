'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ChatWindow from '@/components/common/chat/ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    messages,
    loading,
    loadingMessages,
    error,
    conversationId,
    conversations,
    sendMessage,
    retry,
    startNewConversation,
    setCurrentConversationId,
    deleteConversation,
  } = useChat({ userId: user?.id, loadConversationList: true });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('auth_user');
      }
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleDeleteConversation = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(convId);
      setSidebarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.id) return null;

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* App Bar - Top */}
        <header className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard/chat" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-bold text-indigo-600">Chat Bot</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">{user.username}</span>
            <Link
              href="/dashboard"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7 1a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-1-4h2" />
              </svg>
            </Link>
          </div>
        </header>

        {/* 30% | 70% Chat UI */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Tasks / Conversations with ID - 30% */}
          <aside
            className={`
              flex flex-col bg-white border-r border-gray-200 shrink-0
              w-[280px] sm:w-[30%] min-w-0 max-w-sm
              fixed lg:relative inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="p-3 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Conversations</h2>
            </div>
            <button
              type="button"
              onClick={() => { startNewConversation(); setSidebarOpen(false); }}
              className="mx-3 mt-3 flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2.5 text-sm font-medium hover:bg-indigo-700 transition"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </button>
            <div className="flex-1 overflow-y-auto mt-3 px-2 min-h-0">
              {conversations.length === 0 && !loadingMessages && (
                <p className="px-2 text-sm text-gray-500 py-4">No conversations yet</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-lg mb-0.5 ${
                    conversationId === c.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => { setCurrentConversationId(c.id); setSidebarOpen(false); }}
                    className={`flex-1 text-left px-3 py-2.5 text-sm transition min-w-0 ${
                      conversationId === c.id ? 'text-indigo-700 font-medium' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate block">CHAT {c.id}</span>
                    <span className="text-xs text-gray-500 mt-0.5 block">
                      {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 shrink-0">
              <span className="text-xs text-gray-500 truncate block">{user.username}</span>
            </div>
          </aside>

          {/* Overlay when sidebar open on mobile */}
          {sidebarOpen && (
            <button
              type="button"
              className="lg:hidden fixed inset-0 z-20 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            />
          )}

          {/* Right: Current Chat UI - 70% */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-50">
            <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full">
              <ChatWindow
                messages={messages}
                loading={loading}
                loadingMessages={loadingMessages}
                error={error}
                sendMessage={sendMessage}
                retry={retry}
                chatLayout="full"
              />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

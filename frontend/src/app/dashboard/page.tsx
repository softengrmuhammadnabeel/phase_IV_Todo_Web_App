'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import TaskList from '../../components/tasks/TaskList';
import ChatWindow from '../../components/common/chat/ChatWindow';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

  const closeChat = () => {
    setChatOpen(false);
    setTasksRefreshKey((k) => k + 1);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex flex-col">
        <nav className="flex items-center justify-between px-8 py-6 bg-white/70 backdrop-blur border-b border-gray-200">
          <div className="text-xl font-bold text-indigo-600">
            Todo<span className="text-pink-500">.</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-500">
            <span>Loading</span>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
          </div>
        </nav>

        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex flex-col">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="text-xl font-bold text-indigo-600 tracking-tight">
            Todo<span className="text-pink-500">.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="/dashboard/chat"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Chat
            </Link>
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold">{user?.username}</span>
            </span>

            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-grow px-6 py-10">
          <div className="max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Task Dashboard
              </h1>
              <p className="text-gray-500 mt-2">
                Manage your tasks and stay productive
              </p>
            </div>

            {/* Task List Card */}
            <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6">
              <TaskList userId={user?.id || ''} refreshKey={tasksRefreshKey} />
            </div>
          </div>
        </main>

        {/* Floating Chatbot Icon - bottom right */}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          aria-label="Open chat assistant"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Chat overlay - open on same page, no route */}
        {chatOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
              onClick={closeChat}
            />
            <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[420px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-indigo-50 px-4 py-3">
                <span className="text-sm font-semibold text-indigo-900">Chat assistant</span>
                <button
                  type="button"
                  onClick={closeChat}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
                  aria-label="Close chat"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <ChatWindow
                  userId={user?.id || ''}
                  embedded
                  onResponse={(res) => {
                    if (res.tool_calls?.length) setTasksRefreshKey((k) => k + 1);
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();

  // If already logged in, go to task dashboard instead of home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-400" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 text-gray-900 font-sans flex flex-col">
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 z-50 w-full bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-indigo-600 tracking-tight">
            Todo<span className="text-pink-500">.</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            {isAuthenticated ? (
              <>
                <span className="hidden md:block text-gray-500">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <main className="flex-1 flex items-center justify-center pt-28 px-6">
        <div className="max-w-7xl w-full flex flex-col-reverse md:flex-row items-center gap-12">
          {/* Left: Hero Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-gray-900">
              Structure Your Projects
              <br />
              <span className="text-indigo-600">Clearly & Precisely</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
              Stay on top of your work with a clean, simple, and powerful task manager.
              Track your progress and focus on what matters most.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 shadow-md transition"
              >
                Start for Free
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-indigo-600 px-8 py-3 text-indigo-600 font-medium hover:bg-indigo-200  transition"
              >
                Sign In
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-auto py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Todo App. Made for productivity.
        </div>
      </footer>
    </div>
  );
}

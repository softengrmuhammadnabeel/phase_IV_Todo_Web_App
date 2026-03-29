'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { validateEmail } from '../../../lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-pink-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 md:p-12 flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">
            Todo<span className="text-pink-500">.</span>
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 text-center">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {error && (
            <div className="rounded-md bg-red-100 border border-red-300 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 text-white py-3.5 text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <Link
            href="/signup"
            className="text-sm text-indigo-600 hover:text-indigo-700 transition"
          >
            Do not have an account? Sign up
          </Link>

          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700 transition"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
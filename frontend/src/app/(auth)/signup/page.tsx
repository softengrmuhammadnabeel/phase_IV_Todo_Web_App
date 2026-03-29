'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../../lib/utils';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters with letters and numbers');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, username);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Signup failed. Please try again.');
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
          Create your account
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {error && (
            <div className="rounded-md bg-red-100 border border-red-300 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
            />
          </div>

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

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 text-white py-3.5 text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <Link
            href="/login"
            className="text-sm text-indigo-600 hover:text-indigo-700 transition"
          >
            Already have an account? Sign in
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

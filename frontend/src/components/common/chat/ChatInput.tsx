'use client';

import { useState, useCallback, FormEvent } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  layout?: 'default' | 'chatgpt';
}

export default function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = 'Say something...',
  layout = 'default',
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSubmit(trimmed);
      setValue('');
    },
    [value, disabled, onSubmit]
  );

  const isChatGpt = layout === 'chatgpt';

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isChatGpt
          ? 'flex gap-2 p-3 rounded-2xl bg-white border border-gray-200 shadow-sm'
          : 'flex gap-2 p-3 bg-white border-t border-gray-200'
      }
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 border border-gray-300 disabled:bg-gray-100 disabled:claude-not-allowed ${
          isChatGpt ? 'bg-transparent' : ''
        }`}
        aria-label="Chat message"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className={`rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:claude-not-allowed transition shrink-0 flex items-center justify-center ${
          isChatGpt ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isChatGpt ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9 2zm0 0v-8" />
          </svg>
        ) : (
          'Send'
        )}
      </button>
    </form>
  );
}

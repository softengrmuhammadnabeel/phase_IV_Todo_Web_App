'use client';

import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  layout?: 'default' | 'chatgpt';
}

export default function ChatMessage({ message, layout = 'default' }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isChatGpt = layout === 'chatgpt';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isChatGpt ? 'px-2' : ''}`}
      data-role={message.role}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isChatGpt
            ? isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
            : isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

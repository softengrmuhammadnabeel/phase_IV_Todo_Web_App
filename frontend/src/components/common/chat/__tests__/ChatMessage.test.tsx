import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessage from '../ChatMessage';

describe('ChatMessage', () => {
  it('renders user message content', () => {
    render(
      <ChatMessage message={{ role: 'user', content: 'Hello' }} />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hello').closest('[data-role="user"]')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    render(
      <ChatMessage message={{ role: 'assistant', content: 'Hi there' }} />
    );
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hi there').closest('[data-role="assistant"]')).toBeInTheDocument();
  });
});

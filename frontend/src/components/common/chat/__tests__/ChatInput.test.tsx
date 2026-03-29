import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  it('renders input and submit button', () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    expect(screen.getByPlaceholderText(/Type a message/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed value on submit', () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText(/Type a message/);
    fireEvent.change(input, { target: { value: '  Hello  ' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSubmit).toHaveBeenCalledWith('Hello');
  });

  it('does not submit when disabled', () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} disabled />);
    const input = screen.getByPlaceholderText(/Type a message/);
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

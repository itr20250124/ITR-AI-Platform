import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';
import { Message } from '../../../types';

describe('ChatMessage', () => {
  const mockMessage: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2023-01-01T12:00:00Z'),
  };

  const mockAssistantMessage: Message = {
    id: 'msg-2',
    conversationId: 'conv-1',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    timestamp: new Date('2023-01-01T12:01:00Z'),
  };

  describe('User Message', () => {
    it('should render user message correctly', () => {
      render(<ChatMessage message={mockMessage} />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
      expect(screen.getByText('下午08:00')).toBeInTheDocument();
    });

    it('should show user message on the right side', () => {
      const { container } = render(<ChatMessage message={mockMessage} />);
      
      const messageContainer = container.querySelector('.justify-end');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should show copy button on hover', () => {
      const mockOnCopy = jest.fn();
      render(<ChatMessage message={mockMessage} onCopy={mockOnCopy} />);

      const messageElement = screen.getByText('Hello, how are you?').closest('.flex');
      fireEvent.mouseEnter(messageElement!);

      expect(screen.getByText('複製')).toBeInTheDocument();
    });

    it('should call onCopy when copy button is clicked', () => {
      const mockOnCopy = jest.fn();
      render(<ChatMessage message={mockMessage} onCopy={mockOnCopy} />);

      const messageElement = screen.getByText('Hello, how are you?').closest('.flex');
      fireEvent.mouseEnter(messageElement!);

      const copyButton = screen.getByText('複製');
      fireEvent.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalled();
    });
  });

  describe('Assistant Message', () => {
    it('should render assistant message correctly', () => {
      render(<ChatMessage message={mockAssistantMessage} />);

      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });

    it('should show assistant message on the left side', () => {
      const { container } = render(<ChatMessage message={mockAssistantMessage} />);
      
      const messageContainer = container.querySelector('.justify-start');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should show regenerate button for assistant messages', () => {
      const mockOnRegenerate = jest.fn();
      render(
        <ChatMessage 
          message={mockAssistantMessage} 
          onRegenerate={mockOnRegenerate} 
        />
      );

      const messageElement = screen.getByText('I am doing well, thank you for asking!').closest('.flex');
      fireEvent.mouseEnter(messageElement!);

      expect(screen.getByText('重新生成')).toBeInTheDocument();
    });

    it('should call onRegenerate when regenerate button is clicked', () => {
      const mockOnRegenerate = jest.fn();
      render(
        <ChatMessage 
          message={mockAssistantMessage} 
          onRegenerate={mockOnRegenerate} 
        />
      );

      const messageElement = screen.getByText('I am doing well, thank you for asking!').closest('.flex');
      fireEvent.mouseEnter(messageElement!);

      const regenerateButton = screen.getByText('重新生成');
      fireEvent.click(regenerateButton);

      expect(mockOnRegenerate).toHaveBeenCalled();
    });
  });

  describe('Streaming Message', () => {
    it('should show streaming indicator', () => {
      render(
        <ChatMessage 
          message={mockAssistantMessage} 
          isStreaming={true} 
        />
      );

      expect(screen.getByText('正在輸入...')).toBeInTheDocument();
    });

    it('should show stop button when streaming', () => {
      const mockOnStop = jest.fn();
      render(
        <ChatMessage 
          message={mockAssistantMessage} 
          isStreaming={true}
          onStop={mockOnStop}
        />
      );

      expect(screen.getByText('停止生成')).toBeInTheDocument();
    });

    it('should call onStop when stop button is clicked', () => {
      const mockOnStop = jest.fn();
      render(
        <ChatMessage 
          message={mockAssistantMessage} 
          isStreaming={true}
          onStop={mockOnStop}
        />
      );

      const stopButton = screen.getByText('停止生成');
      fireEvent.click(stopButton);

      expect(mockOnStop).toHaveBeenCalled();
    });

    it('should have pulsing animation when streaming', () => {
      const { container } = render(
        <ChatMessage 
          message={mockAssistantMessage} 
          isStreaming={true} 
        />
      );

      const messageContent = container.querySelector('.animate-pulse');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Code Rendering', () => {
    it('should render inline code correctly', () => {
      const messageWithCode: Message = {
        ...mockMessage,
        content: 'Use `console.log()` to debug',
      };

      render(<ChatMessage message={messageWithCode} />);

      const codeElement = screen.getByText('console.log()');
      expect(codeElement).toHaveClass('bg-gray-200', 'text-gray-800');
    });

    it('should render code blocks correctly', () => {
      const messageWithCodeBlock: Message = {
        ...mockMessage,
        content: '```javascript\nconsole.log("Hello World");\n```',
      };

      render(<ChatMessage message={messageWithCodeBlock} />);

      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.getByText('console.log("Hello World");')).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format timestamp correctly', () => {
      render(<ChatMessage message={mockMessage} />);
      
      // The timestamp should be formatted in Chinese format
      expect(screen.getByText('下午08:00')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should show "已複製" after copying', async () => {
      const mockOnCopy = jest.fn();
      render(<ChatMessage message={mockMessage} onCopy={mockOnCopy} />);

      const messageElement = screen.getByText('Hello, how are you?').closest('.flex');
      fireEvent.mouseEnter(messageElement!);

      const copyButton = screen.getByText('複製');
      fireEvent.click(copyButton);

      expect(screen.getByText('已複製')).toBeInTheDocument();
    });
  });
});
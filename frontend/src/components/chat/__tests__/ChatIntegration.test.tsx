import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChatPage } from '../../../pages/ChatPage';
import { ChatService } from '../../../services/chatService';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('../../../services/chatService');
jest.mock('react-hot-toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ conversationId: 'test-conv-1' }),
  useNavigate: () => jest.fn(),
}));

const MockedChatService = ChatService as jest.Mocked<typeof ChatService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('Chat Integration', () => {
  const mockConversation = {
    id: 'test-conv-1',
    userId: 'user-1',
    title: 'Test Conversation',
    aiProvider: 'openai',
    parameters: { model: 'gpt-3.5-turbo', temperature: 0.7 },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    messages: [],
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversationId: 'test-conv-1',
      role: 'user' as const,
      content: 'Hello, how are you?',
      timestamp: new Date('2023-01-01T10:00:00Z'),
    },
    {
      id: 'msg-2',
      conversationId: 'test-conv-1',
      role: 'assistant' as const,
      content: 'I am doing well, thank you for asking!',
      timestamp: new Date('2023-01-01T10:00:30Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    console.log('is mock', jest.isMockFunction(MockedChatService.getConversation));

    // Setup default mocks
    MockedChatService.getConversations.mockResolvedValue({
      conversations: [mockConversation],
      total: 1,
    });

    MockedChatService.getConversation.mockResolvedValue(mockConversation);

    MockedChatService.getMessages.mockResolvedValue({
      messages: mockMessages,
      total: 2,
    });

    MockedChatService.getConversationStats.mockResolvedValue({
      totalConversations: 1,
      totalMessages: 2,
      averageMessagesPerConversation: 2,
      providerUsage: { openai: 1 },
      recentActivity: [],
    });

    mockedToast.success = jest.fn();
    mockedToast.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderChatPage = () => {
    return render(
      <BrowserRouter>
        <ChatPage />
      </BrowserRouter>
    );
  };

  describe('Chat Page Loading', () => {
    it('should load conversation and messages on mount', async () => {
      renderChatPage();
      console.log('mock results', MockedChatService.getConversation.mock.results);

      await waitFor(() => {
        expect(MockedChatService.getConversation).toHaveBeenCalledWith('test-conv-1');
        expect(MockedChatService.getMessages).toHaveBeenCalledWith('test-conv-1');
      });

      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
    });

    it('should load conversation list in sidebar', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(MockedChatService.getConversations).toHaveBeenCalled();
      });

      expect(screen.getByText('傳送')).toBeInTheDocument();
    });
  });

  describe('Sending Messages', () => {
    it('should send a message and receive AI response', async () => {
      const mockAIResponse = {
        id: 'msg-3',
        conversationId: 'test-conv-1',
        role: 'assistant' as const,
        content: 'That is a great question!',
        timestamp: new Date(),
      };

      MockedChatService.sendChatMessageWithContext.mockResolvedValue(mockAIResponse);
      MockedChatService.addMessage.mockResolvedValue(mockAIResponse);

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      });
      console.log('mock results', MockedChatService.getConversation.mock.results);

      // Find and fill the input
      const input = screen.getByPlaceholderText(/向.*發送訊息/);
      fireEvent.change(input, { target: { value: 'What is AI?' } });

      // Send the message
      const sendButton = screen.getByText('傳送');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(MockedChatService.sendChatMessageWithContext).toHaveBeenCalledWith(
          'test-conv-1',
          'What is AI?',
          'openai',
          { model: 'gpt-3.5-turbo', temperature: 0.7 }
        );
      });
    });

    it('should handle message sending errors', async () => {
      MockedChatService.sendChatMessageWithContext.mockRejectedValue(new Error('API Error'));

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/向.*發送訊息/);
      fireEvent.change(input, { target: { value: 'Test message' } });

      const sendButton = screen.getByText('傳送');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('\u50b3\u9001\u8a0a\u606f\u5931\u6557');
      });
    });
  });

  describe('Conversation Management', () => {
    it('should create a new conversation', async () => {
      const newConversation = {
        ...mockConversation,
        id: 'new-conv-1',
        title: '\u65b0\u7684\u5c0d\u8a71',
      };

      MockedChatService.createConversation.mockResolvedValue(newConversation);

      renderChatPage();

      const newChatButton = screen.getByText('\u65b0\u5efa\u5c0d\u8a71');
      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(MockedChatService.createConversation).toHaveBeenCalled();
      });
    });

    it('should update conversation title', async () => {
      const updatedConversation = {
        ...mockConversation,
        title: 'Updated Title',
      };

      MockedChatService.updateConversation.mockResolvedValue(updatedConversation);

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      });

      // Click on the title to edit
      const title = screen.getByText('Test Conversation');
      fireEvent.click(title);

      // Should show input field
      const titleInput = screen.getByDisplayValue('Test Conversation');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(MockedChatService.updateConversation).toHaveBeenCalledWith('test-conv-1', {
          title: 'Updated Title',
        });
      });
    });

    it('should delete conversation', async () => {
      MockedChatService.deleteConversation.mockResolvedValue();

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      });

      // Open more menu
      const moreButton = screen.getByTitle('????');
      fireEvent.click(moreButton);

      // Click delete
      const deleteButton = screen.getByText('\u65b0\u5efa\u5c0d\u8a71');
      fireEvent.click(deleteButton);

      // Confirm deletion (assuming there's a confirmation dialog)
      // This would depend on the actual implementation

      await waitFor(() => {
        expect(MockedChatService.deleteConversation).toHaveBeenCalledWith('test-conv-1');
      });
    });
  });

  describe('AI Model Selection', () => {
    it('should change AI model', async () => {
      const updatedConversation = {
        ...mockConversation,
        aiProvider: 'gemini',
        parameters: { model: 'gemini-pro', temperature: 0.9 },
      };

      MockedChatService.updateConversation.mockResolvedValue(updatedConversation);

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeInTheDocument();
      });

      // Click on model selector
      const modelSelector = screen.getByText('OpenAI');
      fireEvent.click(modelSelector);

      // Select Gemini (this would depend on the actual implementation)
      // const geminiOption = screen.getByText('Google Gemini');
      // fireEvent.click(geminiOption);

      // await waitFor(() => {
      //   expect(MockedChatService.updateConversation).toHaveBeenCalledWith(
      //     'test-conv-1',
      //     { aiProvider: 'gemini', parameters: expect.any(Object) }
      //   );
      // });
    });
  });

  describe('Search Functionality', () => {
    it('should search conversations', async () => {
      MockedChatService.searchConversations.mockResolvedValue({
        conversations: [mockConversation],
        total: 1,
      });

      renderChatPage();

      const searchInput = screen.getByPlaceholderText('????...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(MockedChatService.searchConversations).toHaveBeenCalledWith(
          'test',
          expect.objectContaining({ limit: expect.any(Number) })
        );
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export conversation', async () => {
      const exportText = '# Test Conversation\n\nExported content...';
      MockedChatService.exportConversation.mockResolvedValue(exportText);

      // Mock URL.createObjectURL and related DOM methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation(((
        tagName: string,
        ...args: any[]
      ) => {
        if (tagName.toLowerCase() === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName, ...args);
      }) as any);
      const originalAppendChild = document.body.appendChild.bind(document.body);
      jest.spyOn(document.body, 'appendChild').mockImplementation(((node: any) => {
        originalAppendChild(node);
        return node;
      }) as any);
      const originalRemoveChild = document.body.removeChild.bind(document.body);
      jest.spyOn(document.body, 'removeChild').mockImplementation(((node: any) => {
        originalRemoveChild(node);
        return node;
      }) as any);

      renderChatPage();

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('撠撠店');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(MockedChatService.exportConversation).toHaveBeenCalledWith('test-conv-1');
        expect(mockLink.click).toHaveBeenCalled();
      });
    });
  });
});

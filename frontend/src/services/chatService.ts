import { apiClient } from './api'
import { Conversation, Message } from '../types'

export interface CreateConversationRequest {
  title: string
  aiProvider: string
  parameters?: Record<string, any>
}

export interface SendMessageRequest {
  message: string
  provider: string
  parameters?: Record<string, any>
}

export interface UpdateConversationRequest {
  title?: string
  aiProvider?: string
  parameters?: Record<string, any>
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
}

export interface MessageListResponse {
  messages: Message[]
  total: number
}

export interface ConversationStats {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  providerUsage: Record<string, number>
  recentActivity: Array<{ date: string; count: number }>
}

const createConversation = async (data: CreateConversationRequest): Promise<Conversation> => {
  const response = await apiClient.post('/conversations', data)
  return response.data.data
}

const getConversations = async (
  options: {
    limit?: number
    offset?: number
    orderBy?: 'createdAt' | 'updatedAt'
    order?: 'asc' | 'desc'
  } = {}
): Promise<ConversationListResponse> => {
  const response = await apiClient.get('/conversations', { params: options })
  return response.data.data
}

const getConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await apiClient.get(`/conversations/${conversationId}`)
  return response.data.data
}

const updateConversation = async (
  conversationId: string,
  data: UpdateConversationRequest
): Promise<Conversation> => {
  const response = await apiClient.put(`/conversations/${conversationId}`, data)
  return response.data.data
}

const deleteConversation = async (conversationId: string): Promise<void> => {
  await apiClient.delete(`/conversations/${conversationId}`)
}

const getMessages = async (
  conversationId: string,
  options: {
    limit?: number
    offset?: number
    before?: Date
    after?: Date
  } = {}
): Promise<MessageListResponse> => {
  const params = {
    ...options,
    before: options.before?.toISOString(),
    after: options.after?.toISOString(),
  }

  const response = await apiClient.get(`/conversations/${conversationId}/messages`, { params })
  return response.data.data
}

const addMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any>
): Promise<Message> => {
  const response = await apiClient.post(`/conversations/${conversationId}/messages`, {
    role,
    content,
    metadata,
  })
  return response.data.data
}

const sendChatMessageWithContext = async (
  conversationId: string,
  message: string,
  provider: string,
  parameters?: Record<string, any>
): Promise<Message> => {
  const response = await apiClient.post(`/conversations/${conversationId}/messages/send`, {
    message,
    provider,
    parameters,
  })

  const aiResponse = response.data.data

  await addMessage(conversationId, 'assistant', aiResponse.content, {
    usage: aiResponse.usage,
    model: parameters?.model,
    finishReason: aiResponse.metadata?.finishReason,
  })

  return aiResponse
}

const sendMessage = async (
  conversationId: string,
  request: SendMessageRequest
): Promise<Message> => {
  const response = await apiClient.post(`/conversations/${conversationId}/messages/send`, request)
  return response.data.data
}

const streamChatMessage = async (
  conversationId: string,
  request: SendMessageRequest,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<() => void> => {
  let abortController: AbortController | null = null

  try {
    abortController = new AbortController()

    const response = await fetch(
      `${apiClient.defaults.baseURL}/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiClient.defaults.headers.common?.Authorization ?? '',
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    let fullResponse = ''
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)

        if (data === '[DONE]') {
          await addMessage(conversationId, 'assistant', fullResponse, {
            model: request.parameters?.model,
            streaming: true,
          })
          onComplete(fullResponse)
          return () => abortController?.abort()
        }

        try {
          const parsed = JSON.parse(data)
          if (parsed.content) {
            fullResponse += parsed.content
            onChunk(parsed.content)
          }
        } catch (error) {
          // ignore malformed chunk
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return () => undefined
    }
    onError(error instanceof Error ? error : new Error('Unknown streaming error'))
  }

  return () => {
    abortController?.abort()
  }
}

const searchConversations = async (
  query: string,
  options: {
    limit?: number
    offset?: number
  } = {}
): Promise<ConversationListResponse> => {
  const response = await apiClient.get('/conversations/search', {
    params: { q: query, ...options },
  })
  return response.data.data
}

const getConversationStats = async (): Promise<ConversationStats> => {
  const response = await apiClient.get('/conversations/stats')
  return response.data.data
}

const createStreamingChat = (
  conversationId: string,
  message: string,
  provider: string,
  parameters: Record<string, any> = {},
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): (() => void) => {
  let abortController: AbortController | null = null

  const startStreaming = async () => {
    try {
      abortController = new AbortController()

      await addMessage(conversationId, 'user', message)

      const messagesResponse = await getMessages(conversationId, { limit: 20 })
      const conversationMessages = messagesResponse.messages

      const contextMessages = conversationMessages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      contextMessages.push({ role: 'user', content: message })

      const response = await fetch(
        `${apiClient.defaults.baseURL}/conversations/${conversationId}/messages/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiClient.defaults.headers.common?.Authorization ?? '',
          },
          body: JSON.stringify({
            message,
            provider,
            parameters,
            context: contextMessages,
          }),
          signal: abortController.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      let fullResponse = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)

          if (data === '[DONE]') {
            await addMessage(conversationId, 'assistant', fullResponse, {
              model: parameters.model,
              streaming: true,
            })
            onComplete(fullResponse)
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullResponse += parsed.content
              onChunk(parsed.content)
            }
          } catch (error) {
            // ignore malformed chunk
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      onError(error instanceof Error ? error : new Error('Unknown streaming error'))
    }
  }

  startStreaming()

  return () => {
    abortController?.abort()
  }
}

const exportConversation = async (conversationId: string): Promise<string> => {
  const conversation = await getConversation(conversationId)
  const messagesResponse = await getMessages(conversationId)

  let exportText = `# ${conversation.title}\n\n`
  exportText += `**AI Provider:** ${conversation.aiProvider}\n`
  exportText += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`
  exportText += `**Messages:** ${messagesResponse.messages.length}\n\n`
  exportText += '---\n\n'

  for (const message of messagesResponse.messages) {
    const timestamp = new Date(message.timestamp).toLocaleString()
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant'
    exportText += `## ${role} (${timestamp})\n\n`
    exportText += `${message.content}\n\n`
  }

  return exportText
}

const generateTitleSuggestion = async (conversationId: string): Promise<string> => {
  const messagesResponse = await getMessages(conversationId, { limit: 5 })
  const messages = messagesResponse.messages

  if (messages.length === 0) {
    return '新的對話'
  }

  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) {
    return '新的對話'
  }

  let title = firstUserMessage.content

  const greetings = ['你好', 'hello', 'hi', '請問', '我想', '能否', '可以']
  for (const greeting of greetings) {
    if (title.toLowerCase().startsWith(greeting)) {
      title = title.substring(greeting.length).trim()
      break
    }
  }

  if (title.length > 30) {
    title = `${title.substring(0, 27)}...`
  }

  return title || '新的對話'
}

export const ChatService = {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  addMessage,
  sendChatMessageWithContext,
  sendMessage,
  streamChatMessage,
  searchConversations,
  getConversationStats,
  createStreamingChat,
  exportConversation,
  generateTitleSuggestion,
}

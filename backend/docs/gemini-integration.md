# Google Gemini API Integration Documentation

## Overview

This document describes the Google Gemini API integration implementation for the multi-AI platform. The integration provides access to Google's Gemini Pro and Gemini Pro Vision models for chat functionality.

## Architecture

### Service Structure

```
backend/src/services/ai/
├── providers/
│   ├── GeminiChatService.ts         # Gemini chat implementation
│   └── __tests__/                   # Unit tests
├── interfaces/
│   └── AIServiceInterface.ts        # Service contracts
├── utils/
│   ├── RetryHandler.ts              # Retry mechanism
│   └── RateLimiter.ts              # Rate limiting
├── BaseAIService.ts                 # Base service class
└── AIServiceFactory.ts              # Service factory
```

### API Endpoints

```
POST /api/ai/chat                    # Send chat message (supports Gemini)
POST /api/ai/chat/context            # Send message with context (supports Gemini)
```

## Features Implemented

### ✅ Chat Services (GeminiChatService)

- **Single Message**: Send individual chat messages
- **Context Messages**: Send messages with conversation history
- **Streaming Support**: Real-time response streaming
- **Parameter Control**: Temperature, max output tokens, top-p, top-k
- **Model Selection**: gemini-pro, gemini-pro-vision
- **Safety Filtering**: Built-in content safety filters

#### Supported Parameters

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| model | select | Gemini models | gemini-pro | Model selection |
| temperature | number | 0-1 | 0.9 | Response creativity |
| maxOutputTokens | number | 1-8192 | 2048 | Maximum response length |
| topP | number | 0-1 | 1 | Nucleus sampling |
| topK | number | 1-40 | 1 | Top-K sampling |

#### Parameter Differences from OpenAI

| Feature | OpenAI | Gemini | Notes |
|---------|--------|--------|-------|
| Temperature Range | 0-2 | 0-1 | Gemini has narrower range |
| Max Tokens | maxTokens (1-4000) | maxOutputTokens (1-8192) | Different parameter name |
| Top-K Sampling | ❌ | ✅ | Gemini-specific parameter |
| Frequency Penalty | ✅ | ❌ | OpenAI-specific |
| Presence Penalty | ✅ | ❌ | OpenAI-specific |

### ✅ Model Support

**Gemini Pro:**
- General-purpose conversational AI
- Text-only input and output
- Optimized for chat and text generation

**Gemini Pro Vision:**
- Multimodal capabilities (text + images)
- Enhanced understanding of visual content
- Future support for image inputs

### ✅ Message Context Handling

- **System Message Filtering**: System messages are filtered out (not supported by Gemini)
- **Role Conversion**: Assistant role converted to "model" for Gemini API
- **History Management**: Proper conversation history handling
- **Context Preservation**: Maintains conversation context across messages

### ✅ Error Handling

- **API Key Validation**: Validates Gemini API key
- **Safety Filter Handling**: Handles content blocked by safety filters
- **Quota Management**: Handles API quota exceeded errors
- **Retry Mechanism**: Exponential backoff for transient failures
- **Standardized Errors**: Converts Gemini errors to standardized format

### ✅ Streaming Support

- **Real-time Responses**: Supports streaming chat responses
- **Chunk Processing**: Handles streaming response chunks
- **Progress Tracking**: Tracks full content as it streams
- **Error Recovery**: Handles streaming errors gracefully

### ✅ Testing

- **Unit Tests**: Comprehensive test coverage for Gemini service
- **Integration Tests**: Factory integration and parameter validation
- **Mock Support**: Proper mocking for Google Generative AI SDK
- **Error Scenarios**: Testing of Gemini-specific error conditions

## API Usage Examples

### Chat Message with Gemini

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "gemini",
    "parameters": {
      "model": "gemini-pro",
      "temperature": 0.9,
      "maxOutputTokens": 2048,
      "topK": 10
    }
  }'
```

### Chat with Context (Gemini)

```bash
curl -X POST http://localhost:3000/api/ai/chat/context \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there!"},
      {"role": "user", "content": "How are you?"}
    ],
    "provider": "gemini",
    "parameters": {
      "model": "gemini-pro",
      "temperature": 0.8,
      "topP": 0.9
    }
  }'
```

### Streaming Chat (Frontend JavaScript)

```javascript
const response = await fetch('/api/ai/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Tell me a story',
    provider: 'gemini',
    parameters: {
      model: 'gemini-pro',
      temperature: 0.9
    }
  })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = new TextDecoder().decode(value);
  console.log('Received chunk:', chunk);
}
```

## Configuration

### Environment Variables

```env
# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_BASE_URL=https://generativelanguage.googleapis.com  # Optional
```

### Service Registration

The Gemini service is automatically registered in the `AIServiceFactory`:

```typescript
// Chat services
this.registerChatService('gemini', () => new GeminiChatService());
```

## Gemini-Specific Features

### Safety Filtering

Gemini includes built-in safety filters that may block content:

```json
{
  "success": false,
  "error": {
    "type": "SAFETY_ERROR",
    "message": "Content blocked by Gemini safety filters",
    "provider": "gemini"
  }
}
```

### Message Format Conversion

Gemini uses a different message format than OpenAI:

```typescript
// OpenAI format
{ role: 'assistant', content: 'Hello' }

// Converted to Gemini format
{ role: 'model', parts: [{ text: 'Hello' }] }
```

### System Message Handling

System messages are filtered out since Gemini doesn't support them:

```typescript
// Input messages
[
  { role: 'system', content: 'You are helpful' },    // Filtered out
  { role: 'user', content: 'Hello' },                // Kept
  { role: 'assistant', content: 'Hi' }               // Kept as 'model'
]
```

## Error Responses

Gemini-specific error responses:

```json
{
  "success": false,
  "error": {
    "type": "API_KEY_INVALID",
    "message": "Invalid Gemini API key",
    "provider": "gemini"
  }
}
```

### Gemini Error Types

- `API_KEY_INVALID`: Invalid or missing API key
- `QUOTA_EXCEEDED`: API quota exceeded
- `SAFETY_ERROR`: Content blocked by safety filters
- `MODEL_NOT_FOUND`: Requested model not available
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded

## Performance Considerations

### Token Usage

- **Prompt Tokens**: Input message tokens
- **Completion Tokens**: Generated response tokens
- **Total Tokens**: Sum of prompt and completion tokens
- **Usage Tracking**: Available through `usageMetadata` in responses

### Rate Limiting

- **Requests per minute**: Varies by API tier
- **Tokens per minute**: Varies by model and tier
- **Concurrent requests**: Limited by API quotas

### Streaming Performance

- **Lower latency**: Responses start arriving immediately
- **Better UX**: Users see responses as they're generated
- **Resource efficient**: Reduces memory usage for long responses

## Security

- **API Key Protection**: Secure storage of Gemini API keys
- **Content Filtering**: Built-in safety filters
- **Input Validation**: Comprehensive parameter validation
- **Authentication**: JWT token required for all endpoints

## Monitoring and Logging

- **Request Logging**: All Gemini API requests logged
- **Error Tracking**: Detailed error logging with Gemini-specific codes
- **Usage Metrics**: Token usage and cost tracking
- **Performance Monitoring**: Response time and success rate tracking

## Comparison with OpenAI

| Feature | OpenAI | Gemini | Winner |
|---------|--------|--------|--------|
| Model Variety | ✅ Multiple GPT models | ✅ Pro + Pro Vision | Tie |
| Parameter Control | ✅ 6 parameters | ✅ 5 parameters | OpenAI |
| Streaming | ✅ Full support | ✅ Full support | Tie |
| Context Length | ✅ Up to 128k tokens | ✅ Up to 32k tokens | OpenAI |
| Safety Filtering | ⚠️ Basic | ✅ Advanced | Gemini |
| Multimodal | ✅ GPT-4V | ✅ Pro Vision | Tie |
| Cost | 💰 Higher | 💰 Lower | Gemini |

## Future Enhancements

- [ ] Image input support for Gemini Pro Vision
- [ ] Function calling capabilities
- [ ] Fine-tuning support
- [ ] Advanced safety filter configuration
- [ ] Batch processing for multiple requests
- [ ] Custom model deployment support
- [ ] Enhanced multimodal capabilities

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Ensure `GEMINI_API_KEY` is set correctly
2. **Content Blocked**: Content may be blocked by safety filters
3. **Quota Exceeded**: Check API usage limits
4. **Model Not Found**: Verify model name is correct
5. **Streaming Errors**: Check network connectivity and timeouts

### Debug Mode

Enable debug logging:

```env
DEBUG=gemini:*
```

This will provide detailed logging of Gemini API interactions.
# OpenAI API Integration Documentation

## Overview

This document describes the OpenAI API integration implementation for the multi-AI platform. The integration includes both chat (GPT models) and image generation (DALL-E models) services.

## Architecture

### Service Structure

```
backend/src/services/ai/
├── providers/
│   ├── OpenAIChatService.ts      # GPT chat implementation
│   ├── OpenAIImageService.ts     # DALL-E image generation
│   └── __tests__/                # Unit tests
├── interfaces/
│   └── AIServiceInterface.ts     # Service contracts
├── utils/
│   ├── RetryHandler.ts           # Retry mechanism
│   └── RateLimiter.ts           # Rate limiting
├── BaseAIService.ts              # Base service class
└── AIServiceFactory.ts           # Service factory
```

### API Endpoints

```
POST /api/ai/chat                 # Send chat message
POST /api/ai/chat/context         # Send message with context
POST /api/ai/image/generate       # Generate image
POST /api/ai/image/variation      # Create image variation
POST /api/ai/image/edit           # Edit image with mask
```

## Features Implemented

### ✅ Chat Services (OpenAIChatService)

- **Single Message**: Send individual chat messages
- **Context Messages**: Send messages with conversation history
- **Streaming Support**: Real-time response streaming
- **Parameter Control**: Temperature, max tokens, top-p, penalties
- **Model Selection**: GPT-3.5-turbo, GPT-4, GPT-4-turbo, GPT-4o

#### Supported Parameters

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| model | select | GPT models | gpt-3.5-turbo | Model selection |
| temperature | number | 0-2 | 0.7 | Response creativity |
| maxTokens | number | 1-4000 | 1000 | Maximum response length |
| topP | number | 0-1 | 1 | Nucleus sampling |
| frequencyPenalty | number | -2-2 | 0 | Reduce repetition |
| presencePenalty | number | -2-2 | 0 | Encourage new topics |

### ✅ Image Services (OpenAIImageService)

- **Image Generation**: Create images from text prompts
- **Image Variations**: Generate variations of existing images
- **Image Editing**: Edit images using masks
- **Model Support**: DALL-E 2 and DALL-E 3
- **Parameter Validation**: Model-specific parameter constraints

#### Supported Parameters

| Parameter | Type | Options | Default | Description |
|-----------|------|---------|---------|-------------|
| model | select | dall-e-2, dall-e-3 | dall-e-3 | Model selection |
| size | select | Various sizes | 1024x1024 | Image dimensions |
| quality | select | standard, hd | standard | Image quality (DALL-E 3 only) |
| style | select | vivid, natural | vivid | Image style (DALL-E 3 only) |
| n | number | 1-4 | 1 | Number of images |

#### Model-Specific Constraints

**DALL-E 2:**
- Sizes: 256x256, 512x512, 1024x1024
- Quality: standard only
- Style: not supported
- n: 1-4 images

**DALL-E 3:**
- Sizes: 1024x1024, 1792x1024, 1024x1792
- Quality: standard, hd
- Style: vivid, natural
- n: 1 image only

### ✅ Error Handling

- **API Error Mapping**: Convert OpenAI errors to standardized format
- **Retry Mechanism**: Exponential backoff for transient failures
- **Rate Limiting**: Built-in rate limiting support
- **Parameter Validation**: Comprehensive parameter validation
- **Type Safety**: Full TypeScript support

### ✅ Testing

- **Unit Tests**: Comprehensive test coverage for services
- **Integration Tests**: API endpoint testing
- **Mock Support**: Proper mocking for external dependencies
- **Error Scenarios**: Testing of error conditions

## API Usage Examples

### Chat Message

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "openai",
    "parameters": {
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 1000
    }
  }'
```

### Chat with Context

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
    "provider": "openai",
    "parameters": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  }'
```

### Image Generation

```bash
curl -X POST http://localhost:3000/api/ai/image/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "provider": "openai",
    "parameters": {
      "model": "dall-e-3",
      "size": "1024x1024",
      "quality": "hd",
      "style": "vivid"
    }
  }'
```

### Image Variation

```bash
curl -X POST http://localhost:3000/api/ai/image/variation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@path/to/image.png" \
  -F "provider=openai" \
  -F "parameters[n]=2" \
  -F "parameters[size]=1024x1024"
```

## Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional, defaults to OpenAI
```

### Service Registration

The services are automatically registered in the `AIServiceFactory`:

```typescript
// Chat services
this.registerChatService('openai', () => new OpenAIChatService());

// Image services
this.registerImageService('openai', () => new OpenAIImageService());
this.registerImageService('dall-e', () => new OpenAIImageService()); // Alias
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "provider": "openai"
  }
}
```

### Error Types

- `MISSING_API_KEY`: API key not configured
- `UNAUTHORIZED`: Invalid API key
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `BAD_REQUEST`: Invalid request parameters
- `SERVER_ERROR`: OpenAI server error
- `CONNECTION_ERROR`: Network connection error
- `INVALID_PARAMETERS`: Parameter validation failed

## Performance Considerations

### Retry Strategy

- **Max Retries**: 3 for chat, 2 for images
- **Base Delay**: 1s for chat, 2s for images
- **Exponential Backoff**: 2x multiplier
- **Jitter**: Random delay to prevent thundering herd

### Rate Limiting

- Built-in rate limiting support
- Configurable limits per service
- Automatic backoff on rate limit errors

### File Upload Limits

- **Max File Size**: 4MB
- **Allowed Types**: Image files only
- **Memory Storage**: Files stored in memory for processing

## Security

- **Authentication Required**: All endpoints require JWT token
- **Input Validation**: Comprehensive parameter validation
- **File Type Validation**: Only image files allowed for uploads
- **Error Sanitization**: Sensitive information filtered from errors

## Monitoring and Logging

- **Request Logging**: All API requests logged
- **Error Tracking**: Detailed error logging
- **Performance Metrics**: Response time tracking
- **Usage Statistics**: Token usage tracking

## Future Enhancements

- [ ] Streaming response support for image generation
- [ ] Batch processing for multiple requests
- [ ] Image optimization and compression
- [ ] Advanced prompt engineering features
- [ ] Cost tracking and budgeting
- [ ] Custom model fine-tuning support
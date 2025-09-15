import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';

// This is an end-to-end test that tests the entire image generation flow
// Note: This test requires actual API keys and should be run in a test environment

const prisma = new PrismaClient();

describe('Image Generation E2E Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Initialize AI services
    AIServiceFactory.initialize();

    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpassword123',
      });

    userId = userResponse.body.data.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.generatedImage.deleteMany({
      where: { userId },
    });
    
    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.$disconnect();
  });

  describe('Complete Image Generation Flow', () => {
    it('should complete full image generation workflow', async () => {
      // Skip if no API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping E2E test: No OpenAI API key provided');
        return;
      }

      // Step 1: Generate an image
      const generateResponse = await request(app)
        .post('/api/ai/image/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'A simple red circle on white background',
          provider: 'openai',
          parameters: {
            model: 'dall-e-2', // Use DALL-E 2 for faster/cheaper testing
            size: '256x256',
            n: 1,
          },
        });

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.success).toBe(true);
      expect(generateResponse.body.data).toMatchObject({
        id: expect.any(String),
        imageUrl: expect.stringMatching(/^https?:\/\//),
        prompt: 'A simple red circle on white background',
        status: 'completed',
      });

      const generatedImageId = generateResponse.body.data.id;

      // Step 2: Verify image was saved to database
      const dbImage = await prisma.generatedImage.findUnique({
        where: { id: generatedImageId },
      });

      expect(dbImage).toBeTruthy();
      expect(dbImage?.userId).toBe(userId);
      expect(dbImage?.provider).toBe('openai');

      // Step 3: Get image history
      const historyResponse = await request(app)
        .get('/api/ai/image/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.success).toBe(true);
      expect(historyResponse.body.data.images).toContainEqual(
        expect.objectContaining({
          id: generatedImageId,
          prompt: 'A simple red circle on white background',
        })
      );

      // Step 4: Filter history by type
      const filteredHistoryResponse = await request(app)
        .get('/api/ai/image/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'generation' });

      expect(filteredHistoryResponse.status).toBe(200);
      expect(filteredHistoryResponse.body.data.images).toContainEqual(
        expect.objectContaining({
          id: generatedImageId,
        })
      );

      // Step 5: Delete the generated image
      const deleteResponse = await request(app)
        .delete(`/api/ai/image/${generatedImageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Step 6: Verify image was deleted
      const deletedImage = await prisma.generatedImage.findUnique({
        where: { id: generatedImageId },
      });

      expect(deletedImage).toBeNull();
    }, 30000); // 30 second timeout for API calls

    it('should handle rate limiting gracefully', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping rate limit test: No OpenAI API key provided');
        return;
      }

      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/ai/image/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            prompt: 'Test rate limiting',
            provider: 'openai',
            parameters: {
              model: 'dall-e-2',
              size: '256x256',
            },
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // At least one request should succeed
      const successfulResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successfulResponses.length).toBeGreaterThan(0);

      // Some requests might be rate limited
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      // Clean up any successful generations
      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value.status === 200) {
          const imageId = response.value.body.data.id;
          await request(app)
            .delete(`/api/ai/image/${imageId}`)
            .set('Authorization', `Bearer ${authToken}`);
        }
      }
    }, 60000); // 60 second timeout for multiple API calls
  });

  describe('Error Handling', () => {
    it('should handle invalid prompts', async () => {
      const response = await request(app)
        .post('/api/ai/image/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: '', // Empty prompt
          provider: 'openai',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/ai/image/generate')
        .send({
          prompt: 'Test prompt',
          provider: 'openai',
        });

      expect(response.status).toBe(401);
    });

    it('should handle invalid provider', async () => {
      const response = await request(app)
        .post('/api/ai/image/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Test prompt',
          provider: 'invalid-provider',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch deletion', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping batch test: No OpenAI API key provided');
        return;
      }

      // Generate multiple images
      const generatePromises = [
        request(app)
          .post('/api/ai/image/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            prompt: 'Batch test image 1',
            provider: 'openai',
            parameters: { model: 'dall-e-2', size: '256x256' },
          }),
        request(app)
          .post('/api/ai/image/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            prompt: 'Batch test image 2',
            provider: 'openai',
            parameters: { model: 'dall-e-2', size: '256x256' },
          }),
      ];

      const generateResponses = await Promise.all(generatePromises);
      const imageIds = generateResponses.map(response => response.body.data.id);

      // Batch delete
      const deleteResponse = await request(app)
        .delete('/api/ai/image/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ imageIds });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.deletedCount).toBe(2);

      // Verify deletion
      const remainingImages = await prisma.generatedImage.findMany({
        where: { id: { in: imageIds } },
      });

      expect(remainingImages).toHaveLength(0);
    }, 45000); // 45 second timeout
  });
});
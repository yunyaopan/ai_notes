/**
 * API integration tests for the categorize endpoint
 * Tests the text categorization API route with mocked dependencies
 */

import { createMockSupabaseClient, mockOpenRouterFunctions } from '../utils/api-mocks';

// Mock the external dependencies before importing the route handlers
jest.mock('../../lib/supabase/server');
jest.mock('../../lib/api/openrouter');

// Mock OpenAI client to prevent browser warning
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('/api/categorize Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    const { client } = createMockSupabaseClient({ authenticated: true });
    mockSupabase = client;
    
    // Mock the createClient function
    const { createClient } = require('../../lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    // Setup OpenRouter function mocks
    const openRouterFunctions = require('../../lib/api/openrouter');
    Object.assign(openRouterFunctions, mockOpenRouterFunctions);

    // Reset to default successful response
    mockOpenRouterFunctions.categorizeText.mockResolvedValue([
      { content: 'I feel grateful', category: 'gratitudes' },
      { content: 'Great idea', category: 'ideas' },
    ]);
  });

  describe('POST /api/categorize validation', () => {
    it('should require text parameter', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text is required');
      expect(mockOpenRouterFunctions.categorizeText).not.toHaveBeenCalled();
    });

    it('should validate text is a string', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ text: 123 })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text is required');
      expect(mockOpenRouterFunctions.categorizeText).not.toHaveBeenCalled();
    });

    it('should accept short text', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ text: 'short' }) // Less than 10 characters
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockOpenRouterFunctions.categorizeText).toHaveBeenCalledWith('short');
    });
  });

  describe('Authentication checks', () => {
    it('should reject unauthenticated requests', async () => {
      // Setup unauthenticated mock
      const { client } = createMockSupabaseClient({ authenticated: false });
      const { createClient } = require('../../lib/supabase/server');
      createClient.mockResolvedValue(client);

      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          text: 'This is a test text that is long enough to pass validation.'
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockOpenRouterFunctions.categorizeText).not.toHaveBeenCalled();
    });
  });

  describe('Successful categorization', () => {
    it('should categorize text without emotional intensity', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const testText = 'I am feeling really grateful for my family today. I also have a great idea for a new app.';

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ text: testText })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chunks).toBeDefined();
      expect(Array.isArray(data.chunks)).toBe(true);
      expect(data.chunks).toHaveLength(2);
      
      // Check that emotional intensity is not added when not provided
      expect(data.chunks[0]).not.toHaveProperty('emotional_intensity');
      expect(data.chunks[1]).not.toHaveProperty('emotional_intensity');

      expect(mockOpenRouterFunctions.categorizeText).toHaveBeenCalledWith(testText);
    });

    it('should categorize text with emotional intensity', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const testText = 'I am feeling really grateful for my family today.';
      const emotionalIntensity = 'high';

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          text: testText,
          emotionalIntensity
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chunks).toBeDefined();
      expect(Array.isArray(data.chunks)).toBe(true);
      
      // Check that emotional intensity is added to all chunks
      data.chunks.forEach((chunk: any) => {
        expect(chunk).toHaveProperty('emotional_intensity', emotionalIntensity);
      });

      expect(mockOpenRouterFunctions.categorizeText).toHaveBeenCalledWith(testText);
    });

    it('should handle different emotional intensity levels', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const intensityLevels = ['low', 'medium', 'high'];

      for (const intensity of intensityLevels) {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            text: 'I am feeling grateful for everything in my life today.',
            emotionalIntensity: intensity
          })
        };

        const response = await POST(mockRequest as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chunks[0]).toHaveProperty('emotional_intensity', intensity);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle OpenRouter API errors gracefully', async () => {
      // Setup OpenRouter error
      mockOpenRouterFunctions.categorizeText.mockRejectedValue(
        new Error('OpenRouter API failed')
      );

      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          text: 'This is a test text that is long enough to pass validation.'
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to categorize text');
    });

    it('should handle OpenRouter timeout errors', async () => {
      // Setup timeout error
      mockOpenRouterFunctions.categorizeText.mockRejectedValue(
        new Error('Request timeout')
      );

      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          text: 'This is a test text that should be categorized but will timeout.'
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to categorize text');
    });
  });

  describe('Response format validation', () => {
    it('should return properly formatted response', async () => {
      const { POST } = await import('../../app/api/categorize/route');

      const customResponse = [
        { content: 'Custom grateful message', category: 'gratitudes' },
        { content: 'Custom idea content', category: 'ideas' },
        { content: 'Some worry', category: 'worries_anxiety' }
      ];

      mockOpenRouterFunctions.categorizeText.mockResolvedValue(customResponse);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          text: 'A longer test text that contains multiple emotional categories and ideas.',
          emotionalIntensity: 'medium'
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('chunks');
      expect(data.chunks).toHaveLength(3);
      
      // Validate structure of each chunk
      data.chunks.forEach((chunk: any, index: number) => {
        expect(chunk).toHaveProperty('content', customResponse[index].content);
        expect(chunk).toHaveProperty('category', customResponse[index].category);
        expect(chunk).toHaveProperty('emotional_intensity', 'medium');
      });
    });

    it('should handle empty response from OpenRouter', async () => {
      mockOpenRouterFunctions.categorizeText.mockResolvedValue([]);

      const { POST } = await import('../../app/api/categorize/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          text: 'This text somehow returns empty categorization.'
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chunks).toEqual([]);
    });
  });
});

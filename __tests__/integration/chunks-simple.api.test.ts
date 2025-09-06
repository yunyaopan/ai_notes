/**
 * Simplified API integration tests using a different approach
 * Tests the API route logic without complex NextRequest construction
 */

import { createMockSupabaseClient, mockDatabaseFunctions } from '../utils/api-mocks';

// Mock the external dependencies before importing the route handlers
jest.mock('../../lib/supabase/server');
jest.mock('../../lib/api/database');

describe('/api/chunks API Logic Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    const { client } = createMockSupabaseClient({ authenticated: true });
    mockSupabase = client;
    
    // Mock the createClient function
    const { createClient } = require('../../lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    // Setup database function mocks
    const dbFunctions = require('../../lib/api/database');
    Object.assign(dbFunctions, mockDatabaseFunctions);
  });

  describe('POST /api/chunks validation logic', () => {
    it('should validate chunks array structure', async () => {
      const { POST } = await import('../../app/api/chunks/route');

      // Create a mock request with empty chunks array
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ chunks: [] })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Chunks array is required');
    });

    it('should validate chunk content requirements', async () => {
      const { POST } = await import('../../app/api/chunks/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          chunks: [{ category: 'gratitudes' }] // Missing content
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Each chunk must have content');
    });

    it('should validate category requirements', async () => {
      const { POST } = await import('../../app/api/chunks/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          chunks: [{ 
            content: 'Test content',
            category: 'invalid_category' 
          }]
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Each chunk must have a valid category');
    });

    it('should process valid chunks successfully', async () => {
      const { POST } = await import('../../app/api/chunks/route');

      const validChunks = [
        {
          content: 'I feel grateful today',
          category: 'gratitudes',
          emotional_intensity: 'medium'
        }
      ];

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ chunks: validChunks })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.chunks).toBeDefined();
      expect(mockDatabaseFunctions.saveTextChunks).toHaveBeenCalledWith(
        validChunks,
        'test-user-id'
      );
    });
  });

  describe('Authentication checks', () => {
    it('should reject unauthenticated requests for POST', async () => {
      // Setup unauthenticated mock
      const { client } = createMockSupabaseClient({ authenticated: false });
      const { createClient } = require('../../lib/supabase/server');
      createClient.mockResolvedValue(client);

      const { POST } = await import('../../app/api/chunks/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          chunks: [{ content: 'test', category: 'other' }]
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockDatabaseFunctions.saveTextChunks).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests for GET', async () => {
      // Setup unauthenticated mock
      const { client } = createMockSupabaseClient({ authenticated: false });
      const { createClient } = require('../../lib/supabase/server');
      createClient.mockResolvedValue(client);

      const { GET } = await import('../../app/api/chunks/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockDatabaseFunctions.getUserTextChunks).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in POST', async () => {
      // Setup database error
      mockDatabaseFunctions.saveTextChunks.mockRejectedValue(
        new Error('Database connection failed')
      );

      const { POST } = await import('../../app/api/chunks/route');

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          chunks: [{ content: 'test', category: 'other' }]
        })
      };

      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save chunks');
    });

    it('should handle database errors in GET', async () => {
      // Setup database error
      mockDatabaseFunctions.getUserTextChunks.mockRejectedValue(
        new Error('Database query failed')
      );

      const { GET } = await import('../../app/api/chunks/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch chunks');
    });
  });

  describe('Successful operations', () => {
    it('should fetch chunks successfully for authenticated user', async () => {
      // Reset mock to ensure clean state
      mockDatabaseFunctions.getUserTextChunks.mockReset();
      mockDatabaseFunctions.getUserTextChunks.mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'Test chunk',
          category: 'other',
          user_id: 'test-user-id',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ]);

      const { GET } = await import('../../app/api/chunks/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chunks).toBeDefined();
      expect(Array.isArray(data.chunks)).toBe(true);
      expect(mockDatabaseFunctions.getUserTextChunks).toHaveBeenCalledWith(
        'test-user-id'
      );
    });
  });
});

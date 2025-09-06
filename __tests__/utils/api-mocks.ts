import { mockUser, mockTextChunks } from './test-helpers';

// Create a comprehensive mock for the Supabase client
export function createMockSupabaseClient(options: {
  authenticated?: boolean;
  shouldError?: boolean;
  mockData?: any;
} = {}) {
  const { authenticated = true, shouldError = false, mockData } = options;

  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockSingle = jest.fn();

  // Chain the methods properly
  mockSelect.mockReturnValue({ 
    eq: mockEq,
    single: mockSingle,
  });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ 
    order: mockOrder,
    eq: mockEq,
    select: mockSelect,
    single: mockSingle,
  });
  mockOrder.mockReturnValue({ 
    order: mockOrder,
    then: jest.fn(),
  });

  // Set up default responses
  if (shouldError) {
    const errorResponse = { data: null, error: { message: 'Database error' } };
    mockSelect.mockResolvedValue(errorResponse);
    mockSingle.mockResolvedValue(errorResponse);
    mockOrder.mockResolvedValue(errorResponse);
  } else {
    const successResponse = { data: mockData || mockTextChunks, error: null };
    mockSelect.mockResolvedValue(successResponse);
    mockSingle.mockResolvedValue({ data: mockTextChunks[0], error: null });
    mockOrder.mockResolvedValue(successResponse);
  }

  const mockClient = {
    auth: {
      getUser: jest.fn().mockResolvedValue(
        authenticated 
          ? { data: { user: mockUser }, error: null }
          : { data: { user: null }, error: { message: 'Unauthorized' } }
      ),
    },
    from: jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }),
  };

  return {
    client: mockClient,
    mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    },
  };
}

// Mock the database functions
export const mockDatabaseFunctions = {
  saveTextChunks: jest.fn(),
  getUserTextChunks: jest.fn(),
  updateTextChunk: jest.fn(),
  updateChunkPinStatus: jest.fn(),
  deleteTextChunk: jest.fn(),
};

// Mock the OpenRouter API
export const mockOpenRouterFunctions = {
  categorizeText: jest.fn(),
};

// Setup default implementations
mockDatabaseFunctions.saveTextChunks.mockResolvedValue(mockTextChunks);
mockDatabaseFunctions.getUserTextChunks.mockResolvedValue(mockTextChunks);
mockDatabaseFunctions.updateTextChunk.mockResolvedValue(mockTextChunks[0]);
mockDatabaseFunctions.updateChunkPinStatus.mockResolvedValue(mockTextChunks[0]);
mockDatabaseFunctions.deleteTextChunk.mockResolvedValue(undefined);

mockOpenRouterFunctions.categorizeText.mockResolvedValue([
  { content: 'I feel grateful', category: 'gratitudes' },
  { content: 'Great idea', category: 'ideas' },
]);

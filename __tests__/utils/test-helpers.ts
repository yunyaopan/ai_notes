import { NextRequest } from 'next/server';

// Helper to create NextRequest for testing
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;
  
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Helper to parse response
export async function parseResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Mock user for authenticated requests
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Mock text chunks
export const mockTextChunks = [
  {
    id: 'chunk-1',
    content: 'I feel grateful for my family today',
    category: 'gratitudes',
    emotional_intensity: 'medium' as const,
    importance: '2' as const,
    pinned: false,
    user_id: 'test-user-id',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'chunk-2',
    content: 'I have a great idea for a new app',
    category: 'ideas',
    emotional_intensity: 'high' as const,
    importance: '1' as const,
    pinned: true,
    user_id: 'test-user-id',
    created_at: '2023-01-01T01:00:00Z',
    updated_at: '2023-01-01T01:00:00Z',
  },
];



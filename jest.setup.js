import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = 'test-anon-key'
process.env.OPENROUTER_API_KEY = 'test-openrouter-key'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
})
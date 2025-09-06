import '@testing-library/jest-dom'

// Polyfills for Next.js Edge Runtime APIs
import { TextDecoder, TextEncoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Web APIs
if (!global.Request) {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this._bodyInit = init.body
    }
    
    async json() {
      return JSON.parse(this._bodyInit || '{}')
    }
    
    async text() {
      return this._bodyInit || ''
    }
  }
}

if (!global.Response) {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
    
    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers
        }
      })
    }
  }
}

if (!global.Headers) {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }
    }
    
    get(name) {
      return this._headers.get(name.toLowerCase())
    }
    
    set(name, value) {
      this._headers.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return this._headers.has(name.toLowerCase())
    }
  }
}

// Mock fetch
global.fetch = global.fetch || jest.fn()

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
// Simple test to verify Jest setup
describe('Basic Test Setup', () => {
  it('should run basic JavaScript tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should work with environment variables', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://localhost:54321');
  });
});

import { CATEGORIES, getCategoryLabels, getCategoryColors, getCategoryKeys, generateCategoriesPrompt } from '@/lib/config/categories';

describe('Categories Configuration', () => {
  describe('CATEGORIES constant', () => {
    it('should contain all expected categories', () => {
      expect(CATEGORIES).toBeDefined();
      expect(Array.isArray(CATEGORIES)).toBe(true);
      expect(CATEGORIES.length).toBeGreaterThan(0);
      
      // Check that each category has required properties
      CATEGORIES.forEach(category => {
        expect(category).toHaveProperty('key');
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('color');
        expect(typeof category.key).toBe('string');
        expect(typeof category.label).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(typeof category.color).toBe('string');
      });
    });

    it('should have unique category keys', () => {
      const keys = CATEGORIES.map(cat => cat.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should include expected core categories', () => {
      const keys = getCategoryKeys();
      expect(keys).toContain('gratitudes');
      expect(keys).toContain('ideas');
      expect(keys).toContain('worries_anxiety');
      expect(keys).toContain('insights');
      expect(keys).toContain('other');
    });
  });

  describe('getCategoryLabels', () => {
    it('should return a mapping of keys to labels', () => {
      const labels = getCategoryLabels();
      expect(typeof labels).toBe('object');
      
      // Check that all categories are included
      CATEGORIES.forEach(category => {
        expect(labels).toHaveProperty(category.key, category.label);
      });
    });
  });

  describe('getCategoryColors', () => {
    it('should return a mapping of keys to colors', () => {
      const colors = getCategoryColors();
      expect(typeof colors).toBe('object');
      
      // Check that all categories are included
      CATEGORIES.forEach(category => {
        expect(colors).toHaveProperty(category.key, category.color);
      });
    });

    it('should have valid Tailwind color classes', () => {
      const colors = getCategoryColors();
      Object.values(colors).forEach(color => {
        expect(color).toMatch(/^bg-\w+-\d+\s+text-\w+-\d+$/);
      });
    });
  });

  describe('getCategoryKeys', () => {
    it('should return an array of all category keys', () => {
      const keys = getCategoryKeys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBe(CATEGORIES.length);
      
      // Check that all keys are included
      CATEGORIES.forEach(category => {
        expect(keys).toContain(category.key);
      });
    });
  });

  describe('generateCategoriesPrompt', () => {
    it('should generate a valid prompt string', () => {
      const prompt = generateCategoriesPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100); // Should be a substantial prompt
      
      // Should include all categories
      CATEGORIES.forEach(category => {
        expect(prompt).toContain(category.key);
        expect(prompt).toContain(category.description);
      });
      
      // Should include JSON format instructions
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('content');
      expect(prompt).toContain('category');
    });

    it('should format categories with numbers', () => {
      const prompt = generateCategoriesPrompt();
      
      // Should start with numbered list
      expect(prompt).toMatch(/1\.\s+"[\w_]+"/);
      expect(prompt).toMatch(/2\.\s+"[\w_]+"/);
    });
  });
});



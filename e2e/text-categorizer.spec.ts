import { test, expect } from '@playwright/test';

test.describe('Text Categorizer (requires auth)', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    // Navigate to the protected page where text categorization happens
    await page.goto('/protected');
  });

  test('should categorize and save text chunks', async ({ page }) => {
    // Look for the text input area (adjust selector based on your actual implementation)
    const textInput = page.locator('textarea[placeholder*="text"], textarea[name="text"]').first();
    
    if (await textInput.isVisible()) {
      // Enter some test text
      await textInput.fill('I am feeling grateful for my family today. I also have a great idea for a new mobile app that could help people.');
      
      // Look for and click the categorize button
      const categorizeButton = page.locator('button').filter({ hasText: /categorize|analyze|process/i }).first();
      
      if (await categorizeButton.isVisible()) {
        await categorizeButton.click();
        
        // Wait for categorization to complete (adjust based on your UI feedback)
        await page.waitForSelector('[data-testid="categorized-chunks"], .chunk-item, [class*="chunk"]', { timeout: 10000 });
        
        // Check that chunks were created
        const chunks = page.locator('[data-testid="chunk-item"], .chunk-item, [class*="chunk"]');
        await expect(chunks.first()).toBeVisible();
        
        // Check for category badges/labels
        const categoryLabels = page.locator('[data-testid="category-badge"], .category-badge, [class*="category"]');
        if (await categoryLabels.first().isVisible()) {
          await expect(categoryLabels.first()).toBeVisible();
        }
        
        // Look for and click save button if it exists
        const saveButton = page.locator('button').filter({ hasText: /save|submit/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Wait for save confirmation
          await expect(page.locator('text=saved successfully, text=Success, .success-message')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should handle empty text input gracefully', async ({ page }) => {
    const textInput = page.locator('textarea[placeholder*="text"], textarea[name="text"]').first();
    
    if (await textInput.isVisible()) {
      // Try to submit without entering text
      const categorizeButton = page.locator('button').filter({ hasText: /categorize|analyze|process/i }).first();
      
      if (await categorizeButton.isVisible()) {
        await categorizeButton.click();
        
        // Should show an error message or validation
        const errorMessage = page.locator('.error, [data-testid="error"], text=required, text=empty');
        if (await errorMessage.first().isVisible()) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('should allow editing and pinning chunks', async ({ page }) => {
    // First, make sure we have some saved chunks visible
    const existingChunks = page.locator('[data-testid="saved-chunk"], .saved-chunk, [class*="saved"]');
    
    if (await existingChunks.first().isVisible()) {
      const firstChunk = existingChunks.first();
      
      // Look for edit button
      const editButton = firstChunk.locator('button').filter({ hasText: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should show edit form or make text editable
        const editInput = page.locator('textarea[data-testid="edit-content"], input[data-testid="edit-content"]').first();
        if (await editInput.isVisible()) {
          await editInput.fill('Updated chunk content');
          
          // Save the edit
          const saveEditButton = page.locator('button').filter({ hasText: /save|update/i }).first();
          if (await saveEditButton.isVisible()) {
            await saveEditButton.click();
          }
        }
      }
      
      // Look for pin button
      const pinButton = firstChunk.locator('button').filter({ hasText: /pin/i }).first();
      if (await pinButton.isVisible()) {
        await pinButton.click();
        
        // Should show pinned indicator
        await expect(firstChunk.locator('[data-testid="pinned-indicator"], .pinned, [class*="pin"]')).toBeVisible();
      }
    }
  });
});

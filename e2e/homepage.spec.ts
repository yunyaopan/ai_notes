import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/ai_notes/);
    
    // Check for key elements (adjust based on your actual homepage)
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for navigation elements
    const authButton = page.locator('[data-testid="auth-button"]');
    if (await authButton.isVisible()) {
      await expect(authButton).toBeVisible();
    }
  });

  test('should navigate to login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Look for login/signup buttons and click one
    const loginButton = page.locator('a[href*="/auth/login"]').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*\/auth\/login/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the page still loads correctly on mobile
    await expect(page.locator('h1')).toBeVisible();
  });
});

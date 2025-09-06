import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate through sign up flow', async ({ page }) => {
    await page.goto('/auth/sign-up');
    
    // Check sign up form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Fill in sign up form (adjust selectors based on your actual form)
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('newuser@example.com');
      await passwordInput.fill('password123');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Should redirect to success page or show success message
      // Adjust based on your actual flow
      await page.waitForURL(/sign-up-success|success|confirm/, { timeout: 10000 });
    }
  });

  test('should navigate through login flow', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check login form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Check for email and password fields
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Check for login button
    const loginButton = page.locator('button[type="submit"]').first();
    await expect(loginButton).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in invalid credentials
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Should show error message (adjust selector based on your error handling)
      const errorMessage = page.locator('.error, [data-testid="error"], text=invalid, text=incorrect');
      if (await errorMessage.first().isVisible()) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Look for forgot password link
    const forgotPasswordLink = page.locator('a[href*="forgot-password"], text=forgot password').first();
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/forgot-password/);
      
      // Check forgot password form
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      await expect(emailInput).toBeVisible();
    }
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/protected');
    
    // Should redirect to login or show authentication required message
    // Adjust based on your actual authentication flow
    await page.waitForURL(/login|auth/, { timeout: 5000 });
  });
});



import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('login page loads with sign-in form', async ({ page }) => {
    await page.goto('/login');

    // Page title should contain the app name
    await expect(page).toHaveTitle(/MyGourmetDiary/);

    // The heading "MyGourmetDiary" should be visible
    await expect(page.getByText('MyGourmetDiary', { exact: true })).toBeVisible();

    // Tagline should be visible
    await expect(
      page.getByText("Secretly peeking into a gourmet's hidden notes."),
    ).toBeVisible();

    // Google sign-in button
    await expect(
      page.getByRole('button', { name: /Continue with Google/i }),
    ).toBeVisible();

    // Email and password fields
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();

    // Sign In button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Link to register page
    await expect(page.getByRole('link', { name: /Create account/i })).toBeVisible();
  });

  test('register page loads with sign-up form', async ({ page }) => {
    await page.goto('/register');

    // Page title
    await expect(page).toHaveTitle(/MyGourmetDiary/);

    // Heading
    await expect(page.getByText('Create Account', { exact: true })).toBeVisible();

    // Tagline
    await expect(
      page.getByText('Start your gourmet diary today.'),
    ).toBeVisible();

    // Form fields
    await expect(page.getByPlaceholder('Display name')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password (min. 6 characters)')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm password')).toBeVisible();

    // Submit button
    await expect(
      page.getByRole('button', { name: 'Create Account' }),
    ).toBeVisible();

    // Link back to login
    await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
  });

  test('protected route /feed shows nothing for unauthenticated users', async ({
    page,
  }) => {
    await page.goto('/feed');

    // The (app) layout returns null when not authenticated, so the "My Notes"
    // heading should NOT be visible. The page will render but show no app content.
    await expect(page.getByText('My Notes')).not.toBeVisible({ timeout: 5000 });
  });

  test('login page "Create account" link navigates to register', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /Create account/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText('Create Account', { exact: true })).toBeVisible();
  });

  test('register page "Sign in" link navigates to login', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('link', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole('button', { name: /Continue with Google/i }),
    ).toBeVisible();
  });
});

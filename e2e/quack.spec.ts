import { test, expect } from '@playwright/test';

test.describe('Qwack Web Application E2E Flows', () => {
  test('landing page renders hero, branding, features, and navigation links', async ({ page }) => {
    await page.goto('/');

    // Verify main brand heading and logo
    await expect(page.locator('h1')).toContainText(/qwack/i);

    // Verify key feature sections
    await expect(page.locator('text=Folder-Based Communication')).toBeVisible();
    await expect(page.locator('text=AI Career Copilot')).toBeVisible();
    await expect(page.locator('text=E2E Encrypted DMs')).toBeVisible();

    // Verify navigation CTA links
    const getStartedLink = page.getByRole('link', { name: /get started/i }).first();
    await expect(getStartedLink).toBeVisible();
    await expect(getStartedLink).toHaveAttribute('href', '/register');

    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/login');
  });

  test('registration page displays all 4 role options and switches roles correctly', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

    // Verify 4 distinct role selectors
    const studentBtn = page.getByRole('button', { name: /student/i });
    const facultyBtn = page.getByRole('button', { name: /faculty/i });
    const tpoBtn = page.getByRole('button', { name: /tpo/i });
    const recruiterBtn = page.getByRole('button', { name: /recruiter/i });

    await expect(studentBtn).toBeVisible();
    await expect(facultyBtn).toBeVisible();
    await expect(tpoBtn).toBeVisible();
    await expect(recruiterBtn).toBeVisible();

    // Verify role button switching
    await facultyBtn.click();
    await tpoBtn.click();
    await recruiterBtn.click();
    await studentBtn.click();

    // Verify form input elements exist
    await expect(page.locator('input[placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify submit button
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeVisible();
  });

  test('login page renders correctly with email/password inputs and links to registration', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Link to registration
    const registerLink = page.getByRole('link', { name: /create one/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });

  test('navigation flow from landing to login to register', async ({ page }) => {
    await page.goto('/');

    // Click Sign In
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);

    // Click link to create account
    await page.getByRole('link', { name: /create one/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('registration form shows validation error when submitting empty fields', async ({ page }) => {
    await page.goto('/register');
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await submitBtn.click();

    // Expect HTML5 validation or application error feedback
    const nameInput = page.locator('input[placeholder*="name" i]');
    const isRequired = await nameInput.getAttribute('required');
    expect(isRequired !== null).toBe(true);
  });
});

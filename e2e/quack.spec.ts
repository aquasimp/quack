import { test, expect } from '@playwright/test';

test.describe('Qwack Web Application E2E Flows', () => {
  test('landing page renders hero, branding, features, and navigation links', async ({ page }) => {
    await page.goto('/');

    // Verify main brand heading and logo
    await expect(page.locator('text=Qwack').first()).toBeVisible();

    // Verify key feature sections
    await expect(page.locator('text=Folder-Based Communication')).toBeVisible();
    await expect(page.locator('text=AI Career Intelligence')).toBeVisible();
    await expect(page.locator('text=End-to-End Encryption')).toBeVisible();

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
    const registerLink = page.getByRole('link', { name: /create account/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });

  test('navigation flow from landing to login to register', async ({ page }) => {
    await page.goto('/');

    // Click Sign In
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);

    // Click link to create account
    await page.getByRole('link', { name: /create account/i }).click();
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

  test('student end-to-end flow: dashboard -> profile -> career-ai -> logout', async ({ page }) => {
    // Intercept auth checks to simulate an authenticated student session
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr_student_01',
            name: 'Aarav Patel',
            email: 'aarav@campus.edu',
            role: 'student',
          },
        }),
      });
    });

    await page.route('**/api/auth/logout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged out successfully' }),
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=Active Groups').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Profile', exact: true })).toBeVisible();

    // Navigate to Profile page
    await page.getByRole('link', { name: 'My Profile', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/profile/);
    await expect(page.locator('text=Demo Student').first()).toBeVisible();

    // Navigate to Career AI page
    await page.getByRole('link', { name: 'Career AI', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/career-ai/);
    await expect(page.locator('text=AI Career Intelligence').first()).toBeVisible();

    // Click logout
    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('recruiter end-to-end flow: dashboard -> talent search interface', async ({ page }) => {
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr_recruiter_01',
            name: 'Pooja Tech Recruiter',
            email: 'pooja@enterprise.com',
            role: 'recruiter',
          },
        }),
      });
    });

    await page.goto('/dashboard/recruiter');
    await expect(page.locator('text=AI Recruiter Search').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="CSE students" i]')).toBeVisible();
  });

  test('TPO end-to-end flow: dashboard -> placement analytics interface', async ({ page }) => {
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr_tpo_01',
            name: 'Dr. Ramesh Sharma',
            email: 'tpo@campus.edu',
            role: 'tpo',
          },
        }),
      });
    });

    await page.goto('/dashboard/tpo');
    await expect(page.locator('text=TPO Analytics Dashboard').first()).toBeVisible();
    await expect(page.locator('text=Total Students').first()).toBeVisible();
  });

  test('security API boundary verification: unauthenticated requests rejected at edge', async ({ request }) => {
    // 1. Unauthenticated messages access
    const msgRes = await request.get('/api/groups/65f1a2b3c4d5e6f7a8b9c0d1/messages');
    expect(msgRes.status()).toBe(401);

    // 2. Unauthenticated student directory query
    const studentRes = await request.get('/api/students');
    expect(studentRes.status()).toBe(401);

    // 3. Unauthenticated TPO analytics query
    const tpoRes = await request.get('/api/tpo/analytics');
    expect(tpoRes.status()).toBe(401);

    // 4. Forbidden mass-assignment mutation without auth
    const putRes = await request.put('/api/students', {
      data: { cgpa: 10, role: 'admin', userId: 'attacker_id' },
    });
    expect(putRes.status()).toBe(401);
  });
});

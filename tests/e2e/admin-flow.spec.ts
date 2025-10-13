import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should complete create → preview → close → analytics flow', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');
    await expect(page.locator('h4')).toContainText('MarketPrice');

    // 2. Login as admin
    await page.fill('input[type="email"]', 'admin@hbs.edu');
    await page.click('button[type="submit"]');

    // Wait for magic link to appear (development mode)
    await expect(page.locator('text=Magic link sent!')).toBeVisible();

    // Get the magic link and navigate to it
    const magicLink = await page.locator('a[href*="/api/auth/verify"]');
    const linkHref = await magicLink.getAttribute('href');

    if (linkHref) {
      await page.goto(linkHref);
    }

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h4')).toContainText('Events Dashboard');

    // 3. Navigate to create event page
    await page.click('button:has-text("Create Event")');
    await expect(page).toHaveURL('/admin/events/new');
    await expect(page.locator('h4')).toContainText('Create New Event');

    // 4. Fill out event creation form
    await page.fill('input[name="title"]', 'E2E Test Event');
    await page.fill('textarea[label="Description"]', 'This is a test event created by Playwright for end-to-end testing purposes.');
    await page.fill('input[label="Club Name"]', 'Test Club');

    // Set event date/time (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

    // Click the date picker fields and set dates
    await page.locator('label:has-text("Event Date & Time")').locator('..').locator('input').first().click();
    await page.keyboard.type(dateString);

    await page.fill('input[label="Venue"]', 'Test Venue Hall');
    await page.fill('input[label="Retail Ticket Price"]', '75');
    await page.fill('input[label="Max Resale Cap (Optional)"]', '125');

    // Set listing window dates
    const listingOpen = new Date();
    listingOpen.setDate(listingOpen.getDate() - 1); // Yesterday
    const listingOpenString = listingOpen.toISOString().slice(0, 16);

    const listingClose = new Date();
    listingClose.setDate(listingClose.getDate() + 29); // Day before event
    const listingCloseString = listingClose.toISOString().slice(0, 16);

    await page.locator('label:has-text("Listing Open Time")').locator('..').locator('input').first().click();
    await page.keyboard.type(listingOpenString);

    await page.locator('label:has-text("Listing Close Time")').locator('..').locator('input').first().click();
    await page.keyboard.type(listingCloseString);

    // 5. Verify preview panel updates
    await expect(page.locator('text=Live Preview')).toBeVisible();
    await expect(page.locator('text=E2E Test Event')).toBeVisible();
    await expect(page.locator('text=Test Club')).toBeVisible();
    await expect(page.locator('text=$75.00')).toBeVisible();

    // Check that liquidity meter is visible
    await expect(page.locator('text=Market Liquidity')).toBeVisible();

    // 6. Submit the form
    await page.click('button[type="submit"]:has-text("Create Event")');

    // Wait for success message
    await expect(page.locator('text=Event created successfully!')).toBeVisible({ timeout: 10000 });

    // Should redirect back to admin dashboard
    await expect(page).toHaveURL('/admin', { timeout: 5000 });

    // Verify the event appears in the dashboard
    await expect(page.locator('text=E2E Test Event')).toBeVisible();
    await expect(page.locator('text=Test Club')).toBeVisible();

    // 7. Click on Analytics button for the event
    // Find the card containing our event and click its Analytics button
    const eventCard = page.locator('div').filter({ hasText: 'E2E Test Event' }).first();
    await eventCard.locator('button:has-text("Analytics")').click();

    // Should navigate to analytics page
    await expect(page.url()).toContain('/analytics');
    await expect(page.locator('h4')).toContainText('Event Analytics');
    await expect(page.locator('text=E2E Test Event')).toBeVisible();

    // 8. Verify analytics metrics are displayed
    await expect(page.locator('text=Total Trades')).toBeVisible();
    await expect(page.locator('text=Avg Resale Price')).toBeVisible();
    await expect(page.locator('text=Sell-Through Rate')).toBeVisible();
    await expect(page.locator('text=Price Range')).toBeVisible();

    // Verify charts are present
    await expect(page.locator('text=Price Distribution')).toBeVisible();
    await expect(page.locator('text=Average Price Over Time')).toBeVisible();
    await expect(page.locator('text=Trade Volume Over Time')).toBeVisible();

    // 9. Navigate back to admin dashboard
    await page.click('button:has-text("Back")');
    await expect(page).toHaveURL('/admin');
  });

  test('should validate form fields', async ({ page }) => {
    // Login as admin (using existing token if available)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hbs.edu');
    await page.click('button[type="submit"]');

    const magicLink = await page.locator('a[href*="/api/auth/verify"]');
    const linkHref = await magicLink.getAttribute('href');
    if (linkHref) {
      await page.goto(linkHref);
    }

    await expect(page).toHaveURL('/admin');

    // Navigate to create event
    await page.click('button:has-text("Create Event")');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create Event")');

    // Should show validation errors
    // Note: HTML5 validation will prevent submission, so we'll just verify required fields exist
    await expect(page.locator('input[required]')).toHaveCount(5); // title, description, clubName, venue, retailPrice
  });

  test('should allow logout from admin dashboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hbs.edu');
    await page.click('button[type="submit"]');

    const magicLink = await page.locator('a[href*="/api/auth/verify"]');
    const linkHref = await magicLink.getAttribute('href');
    if (linkHref) {
      await page.goto(linkHref);
    }

    await expect(page).toHaveURL('/admin');

    // Click logout
    await page.locator('button[aria-label="Logout"]').click();

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });
});

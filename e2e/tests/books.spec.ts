import { test, expect, NORTHERN_LIGHTS, POLAR_JOURNEY, bookCard, cards, failedCall } from './polar';

test('the book list shows the catalog', async ({ page }) => {
  await page.goto('/#/browse-books');
  await expect(page.getByRole('heading', { name: 'Browse Books' })).toBeVisible();
  await expect(cards(page)).toHaveCount(2);
  const card = bookCard(page, NORTHERN_LIGHTS.isbn);
  await expect(card.locator('mat-card-title')).toContainText(NORTHERN_LIGHTS.title);
  await expect(card).toContainText(`Author: ${NORTHERN_LIGHTS.author}`);
  await expect(card).toContainText(`Publisher: ${NORTHERN_LIGHTS.publisher}`);
  await expect(card).toContainText(`Price: $${NORTHERN_LIGHTS.price}`);
  await expect(card.getByRole('button', { name: 'ORDER' })).toBeVisible();
  await expect(bookCard(page, POLAR_JOURNEY.isbn)).toContainText(POLAR_JOURNEY.title);
});

test('an empty catalog shows an empty book list', async ({ page, api }) => {
  api.books = [];
  await page.goto('/#/browse-books');
  await expect(page.getByRole('heading', { name: 'Browse Books' })).toBeVisible();
  await expect.poll(() => api.callsTo('GET', '/books').length).toBe(1);
  await expect(page.locator('mat-spinner')).toHaveCount(0);
  await expect(cards(page)).toHaveCount(0);
});

// BookListComponent says that the books can't be loaded in place of the list (finding 39 in the
// main repository), and the visitor isn't sent to log in.
test('a failing catalog says the books cannot be loaded', async ({ page, api, problems }) => {
  problems.allow(...failedCall('GET', '/books', 500));
  api.fail('GET', '/books', 500);
  const books = page.waitForResponse(r => r.url().endsWith('/books'));
  await page.goto('/#/browse-books');
  expect((await books).status()).toBe(500);
  await expect(page.getByRole('heading', { name: 'Browse Books' })).toBeVisible();
  await expect(page.getByText("The books can't be loaded. Please try again later.")).toBeVisible();
  await expect(page.locator('mat-spinner')).toHaveCount(0);
  await expect(cards(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#\/browse-books$/);
});

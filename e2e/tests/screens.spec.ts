import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, CUSTOMER, EMPLOYEE, FONTS, NORTHERN_LIGHTS, type Order, cards, openMenu } from './polar';

// Not tests: a record of how the main pages look, and what axe-core finds on them, to compare
// before and after a change to the look, such as Angular Material's. Run only with
// UI_TEST_VISUAL=<directory> (see playwright.config.ts), which gets a PNG and an axe-core report
// per page. Pixels differ between browsers and fonts, so the screenshots aren't asserted.
const dir = process.env.UI_TEST_VISUAL ?? '';

test.use({ viewport: { width: 1280, height: 800 } });

// The other tests block Google Fonts; the screenshots show the fonts and icons users see.
test.beforeEach(async ({ page }) => {
  await page.unroute(FONTS);
});

async function record(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true, animations: 'disabled' });
  const { violations } = await new AxeBuilder({ page }).analyze();
  const report = violations.map(v => ({
    id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map(n => n.target.join(' ')),
  }));
  writeFileSync(join(dir, `${name}.axe.json`), JSON.stringify(report, null, 2) + '\n');
}

test('anonymous Browse Books @visual', async ({ page }) => {
  await page.goto('/#/browse-books');
  await expect(cards(page)).toHaveCount(2);
  await record(page, 'browse-books-anonymous');
});

test('the menu of an employee @visual', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/#/browse-books');
  await expect(cards(page)).toHaveCount(2);
  await openMenu(page);
  await record(page, 'menu-employee');
});

test('Add Book @visual', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/#/add-book');
  await expect(page.getByRole('button', { name: 'Create Book' })).toBeVisible();
  await record(page, 'add-book');
});

test('Edit Book @visual', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto(`/#/edit-book/${NORTHERN_LIGHTS.isbn}`);
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(NORTHERN_LIGHTS.title);
  await record(page, 'edit-book');
});

test('Edit Book while the book loads @visual', async ({ page, api }) => {
  api.user = EMPLOYEE;
  // Registered after the mock, so it takes the request first, and never answers it.
  await page.route(`**/books/${NORTHERN_LIGHTS.isbn}`, () => {});
  await page.goto(`/#/edit-book/${NORTHERN_LIGHTS.isbn}`);
  await expect(page.locator('mat-spinner')).toBeVisible();
  await record(page, 'edit-book-loading');
});

test('the order dialog @visual', async ({ page, api }) => {
  api.user = CUSTOMER;
  await page.goto('/#/browse-books');
  await cards(page).first().getByRole('button', { name: 'ORDER' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Submit Order' })).toBeVisible();
  await record(page, 'order-dialog');
});

test('My Orders @visual', async ({ page, api }) => {
  api.user = CUSTOMER;
  const order = (id: number, quantity: number, status: Order['status']): Order => ({
    id, bookIsbn: NORTHERN_LIGHTS.isbn, bookName: `${NORTHERN_LIGHTS.title} - ${NORTHERN_LIGHTS.author}`,
    bookPrice: NORTHERN_LIGHTS.price, quantity, status,
  });
  api.orders = [order(1, 2, 'ACCEPTED'), order(2, 1, 'DISPATCHED'), order(3, 5, 'REJECTED')];
  await page.goto('/#/my-orders');
  await expect(cards(page)).toHaveCount(3);
  await record(page, 'my-orders');
});

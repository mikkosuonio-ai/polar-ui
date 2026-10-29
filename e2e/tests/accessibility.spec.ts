import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, CUSTOMER, EMPLOYEE, NORTHERN_LIGHTS, cards, openMenu } from './polar';

// axe-core finds no serious or critical violations on the main pages. Moderate ones remain, as
// in plan/screens: content outside landmarks, no h1 on the book forms, and the nested
// navigation landmarks.
async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test('Browse Books and the menu', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/#/browse-books');
  await expect(cards(page)).toHaveCount(2);
  await openMenu(page);
  await expectNoSeriousViolations(page);
});

test('Add Book', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/#/add-book');
  await expect(page.getByRole('button', { name: 'Create Book' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('Edit Book, and while the book loads', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.route(`**/books/${NORTHERN_LIGHTS.isbn}`, () => {});
  await page.goto(`/#/edit-book/${NORTHERN_LIGHTS.isbn}`);
  await expect(page.locator('mat-spinner')).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.unroute(`**/books/${NORTHERN_LIGHTS.isbn}`);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(NORTHERN_LIGHTS.title);
  await expectNoSeriousViolations(page);
});

test('the order dialog and My Orders', async ({ page, api }) => {
  api.user = CUSTOMER;
  await page.goto('/#/browse-books');
  await cards(page).first().getByRole('button', { name: 'ORDER' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Submit Order' })).toBeVisible();
  await expectNoSeriousViolations(page);

  await dialog.getByRole('button', { name: 'Submit Order' }).click();
  await expect(cards(page)).toHaveCount(1);
  await expectNoSeriousViolations(page);
});

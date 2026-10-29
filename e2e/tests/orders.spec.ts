import { test, expect, CUSTOMER, failedCall, NORTHERN_LIGHTS, type Order, bookCard, cards, orderCard } from './polar';

test.beforeEach(({ api }) => {
  api.user = CUSTOMER;
});

test('a customer orders a book in the order dialog', async ({ page, api }) => {
  await page.goto('/#/browse-books');
  await bookCard(page, NORTHERN_LIGHTS.isbn).getByRole('button', { name: 'ORDER' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(`Order ${NORTHERN_LIGHTS.title}`);
  await expect(dialog).toContainText(`By ${NORTHERN_LIGHTS.author}`);
  const quantity = dialog.getByRole('spinbutton', { name: 'Quantity' });
  await expect(quantity).toHaveValue('1');
  await quantity.fill('3');
  await dialog.getByRole('button', { name: 'Submit Order' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#\/my-orders$/);
  expect(api.callsTo('POST', '/orders').map(c => c.body)).toEqual([{ isbn: NORTHERN_LIGHTS.isbn, quantity: 3 }]);
  const card = orderCard(page, 1);
  await expect(card).toContainText(`Book: ${NORTHERN_LIGHTS.title} - ${NORTHERN_LIGHTS.author}`);
  await expect(card).toContainText('Quantity: 3');
  await expect(card).toContainText('Status: ACCEPTED');
  await expect(card).toContainText('Total: $29.70');
});

test('"My Orders" shows each order with its total', async ({ page, api }) => {
  const order = (id: number, bookPrice: number, quantity: number, status: Order['status']): Order => ({
    id, bookIsbn: NORTHERN_LIGHTS.isbn, bookName: `${NORTHERN_LIGHTS.title} - ${NORTHERN_LIGHTS.author}`,
    bookPrice, quantity, status,
  });
  api.orders = [order(42, 19.9, 3, 'ACCEPTED'), order(43, 12.5, 2, 'DISPATCHED'), order(44, 9.9, 1, 'REJECTED')];
  await page.goto('/#/my-orders');

  await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
  await expect(cards(page)).toHaveCount(3);
  await expect(orderCard(page, 42)).toContainText('Price: $19.9');
  await expect(orderCard(page, 42)).toContainText('Total: $59.70');
  await expect(orderCard(page, 43)).toContainText('Status: DISPATCHED');
  await expect(orderCard(page, 43)).toContainText('Total: $25.00');
  // In dollars and cents (finding 40 in the main repository: toPrecision(4) gave $9.900).
  await expect(orderCard(page, 44)).toContainText('Total: $9.90');
});

test('failing orders say so', async ({ page, api, problems }) => {
  problems.allow(...failedCall('POST', '/orders', 503), ...failedCall('GET', '/orders', 500));
  api.fail('POST', '/orders', 503);
  await page.goto('/#/browse-books');
  await bookCard(page, NORTHERN_LIGHTS.isbn).getByRole('button', { name: 'ORDER' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Submit Order' }).click();
  await expect(page.getByText("The order can't be submitted. Please try again.")).toBeVisible();
  await expect(dialog).toBeVisible();

  api.fail('GET', '/orders', 500);
  await page.goto('/#/my-orders');
  await expect(page.getByText("The orders can't be loaded. Please try again later.")).toBeVisible();
  await expect(page.locator('mat-spinner')).toHaveCount(0);
});

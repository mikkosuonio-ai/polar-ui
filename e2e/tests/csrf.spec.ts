import { test, expect, CUSTOMER, EMPLOYEE, NORTHERN_LIGHTS, POLAR_JOURNEY, bookCard } from './polar';

// edge-service sets Spring Security's XSRF-TOKEN cookie. The SPA sends its raw value back:
// Angular's HttpClient as the X-XSRF-TOKEN header on writes, and the logout form as _csrf.
// Angular's update moves the HTTP layer (provideHttpClient, the fetch backend), so this pins
// what edge-service relies on.
const TOKEN = 'mocked-xsrf-token';

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: TOKEN, url: baseURL! }]);
});

test('writes send the XSRF-TOKEN cookie back as X-XSRF-TOKEN, and every call X-Requested-With', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/#/add-book');
  await page.getByRole('textbox', { name: 'ISBN' }).fill('9781234567');
  await page.getByRole('textbox', { name: 'Title' }).fill('Mocked Book');
  await page.getByRole('textbox', { name: 'Author' }).fill('Browser Tester');
  await page.getByRole('spinbutton', { name: 'Price' }).fill('7.5');
  await page.getByRole('button', { name: 'Create Book' }).click();
  await expect(bookCard(page, '9781234567')).toBeVisible();

  await bookCard(page, NORTHERN_LIGHTS.isbn).getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('spinbutton', { name: 'Price' }).fill('8.25');
  await page.getByRole('button', { name: 'Update Book' }).click();
  await expect(bookCard(page, NORTHERN_LIGHTS.isbn)).toContainText('Price: $8.25');

  await bookCard(page, POLAR_JOURNEY.isbn).getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('menuitem', { name: 'Remove' }).click();
  await expect(bookCard(page, POLAR_JOURNEY.isbn)).toHaveCount(0);

  await bookCard(page, NORTHERN_LIGHTS.isbn).getByRole('button', { name: 'ORDER' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Submit Order' }).click();
  await expect(page).toHaveURL(/#\/my-orders$/);
  await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();

  const writes = api.calls.filter(c => c.method !== 'GET');
  expect(writes.map(c => `${c.method} ${c.path}`)).toEqual([
    'POST /books', `PUT /books/${NORTHERN_LIGHTS.isbn}`, `DELETE /books/${POLAR_JOURNEY.isbn}`, 'POST /orders',
  ]);
  for (const write of writes) {
    expect(write.headers['x-xsrf-token'], `${write.method} ${write.path}`).toBe(TOKEN);
  }
  for (const read of api.calls.filter(c => c.method === 'GET')) {
    expect(read.headers['x-xsrf-token'], `GET ${read.path}`).toBeUndefined();
  }
  for (const call of api.calls) {
    expect(call.headers['x-requested-with'], `${call.method} ${call.path}`).toBe('XMLHttpRequest');
  }
});

test('the logout form posts the XSRF-TOKEN cookie as _csrf', async ({ page, api }) => {
  api.user = CUSTOMER;
  await page.goto('/');
  await page.getByRole('button', { name: 'Log Out' }).click();

  await expect(page).toHaveURL(/\/logout$/);
  expect(api.callsTo('POST', '/logout').map(c => c.body)).toEqual([{ _csrf: TOKEN }]);
});

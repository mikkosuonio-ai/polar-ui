import { test, expect, EMPLOYEE, NORTHERN_LIGHTS, POLAR_JOURNEY, bookCard, cards, failedCall } from './polar';

test.beforeEach(({ api }) => {
  api.user = EMPLOYEE;
});

test('an employee adds a book', async ({ page, api }) => {
  await page.goto('/#/add-book');
  await page.getByRole('textbox', { name: 'ISBN' }).fill('9781234567');
  await page.getByRole('textbox', { name: 'Title' }).fill('Mocked Book');
  await page.getByRole('textbox', { name: 'Author' }).fill('Browser Tester');
  await page.getByRole('textbox', { name: 'Publisher' }).fill('Polarsophia');
  await page.getByRole('spinbutton', { name: 'Price' }).fill('7.5');
  await page.getByRole('button', { name: 'Create Book' }).click();

  await expect(page).toHaveURL(/#\/browse-books$/);
  // The form's id stays undefined, so JSON leaves it out.
  expect(api.callsTo('POST', '/books').map(c => c.body)).toEqual([{
    isbn: '9781234567', title: 'Mocked Book', author: 'Browser Tester', price: 7.5, publisher: 'Polarsophia',
  }]);
  await expect(bookCard(page, '9781234567')).toContainText('Mocked Book');
  await expect(bookCard(page, '9781234567')).toContainText('Price: $7.5');
});

test('an employee edits a book', async ({ page, api }) => {
  await page.goto('/#/browse-books');
  await bookCard(page, NORTHERN_LIGHTS.isbn).getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();

  await expect(page).toHaveURL(new RegExp(`#/edit-book/${NORTHERN_LIGHTS.isbn}$`));
  await expect(page.getByText('Edit Book')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(NORTHERN_LIGHTS.title);
  const price = page.getByRole('spinbutton', { name: 'Price' });
  await expect(price).toHaveValue(String(NORTHERN_LIGHTS.price));
  await price.fill('8.25');
  await page.getByRole('button', { name: 'Update Book' }).click();

  await expect(page).toHaveURL(/#\/browse-books$/);
  expect(api.callsTo('PUT', `/books/${NORTHERN_LIGHTS.isbn}`).map(c => c.body))
    .toEqual([{ ...NORTHERN_LIGHTS, price: 8.25 }]);
  await expect(bookCard(page, NORTHERN_LIGHTS.isbn)).toContainText('Price: $8.25');
});

// The list used to keep a removed book until the page was loaded again (finding 37 in the main
// repository's review). It loads the list again, so it also shows changes made elsewhere.
test('removing a book loads the book list again', async ({ page, api }) => {
  await page.goto('/#/browse-books');
  await expect(cards(page)).toHaveCount(2);
  api.books.push({ isbn: '9781234567', title: 'Added Elsewhere', author: 'Another Employee', price: 1 });

  await bookCard(page, NORTHERN_LIGHTS.isbn).getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('menuitem', { name: 'Remove' }).click();

  await expect(bookCard(page, NORTHERN_LIGHTS.isbn)).toHaveCount(0);
  await expect(bookCard(page, POLAR_JOURNEY.isbn)).toBeVisible();
  await expect(bookCard(page, '9781234567')).toBeVisible();
  expect(api.callsTo('DELETE', `/books/${NORTHERN_LIGHTS.isbn}`)).toHaveLength(1);
  expect(api.callsTo('GET', '/books')).toHaveLength(2);
});

// When GET /books/{isbn} fails, as it will with catalog-service down once edge-service answers
// it with 503 (finding 38 in the main repository's review), EditBookComponent, which has no
// error handler, shows its spinner for good. It should say that the book can't be loaded.
test('the edit page says so when the book cannot be loaded', async ({ page, api, problems }) => {
  test.fail(true, 'EditBookComponent has no error handling (finding 38 in the main repository)');
  problems.allow(...failedCall('GET', `/books/${NORTHERN_LIGHTS.isbn}`, 503));
  api.fail('GET', `/books/${NORTHERN_LIGHTS.isbn}`, 503);
  const book = page.waitForResponse(r => r.url().endsWith(`/books/${NORTHERN_LIGHTS.isbn}`));
  await page.goto(`/#/edit-book/${NORTHERN_LIGHTS.isbn}`);
  expect((await book).status()).toBe(503);
  await expect(page.locator('mat-spinner')).toHaveCount(0);
  await expect(page.getByText(/can't be loaded|cannot be loaded|try again/i)).toBeVisible();
});

import { test, expect, CUSTOMER, EMPLOYEE, openMenu } from './polar';

test('an anonymous visitor sees "Log In" and only "Browse Books" in the menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Polar Bookshop', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log Out' })).toHaveCount(0);
  const menu = await openMenu(page);
  await expect(menu.links).toHaveCount(1);
});

test('a customer sees "Log Out", and "My Orders" but not "Add Book" in the menu', async ({ page, api }) => {
  api.user = CUSTOMER;
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toHaveCount(0);
  const menu = await openMenu(page);
  await expect(menu.myOrders).toBeVisible();
  await expect(menu.addBook).toHaveCount(0);
  await expect(menu.links).toHaveCount(2);
});

test('an employee sees "Log Out", "Add Book" and "My Orders" in the menu', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible();
  const menu = await openMenu(page);
  await expect(menu.addBook).toBeVisible();
  await expect(menu.myOrders).toBeVisible();
  await expect(menu.links).toHaveCount(3);
});

test('the menu links lead to their pages', async ({ page, api }) => {
  api.user = EMPLOYEE;
  await page.goto('/');
  let menu = await openMenu(page);
  await menu.addBook.click();
  await expect(page).toHaveURL(/#\/add-book$/);
  await expect(page.getByText('Add New Book')).toBeVisible();
  await menu.myOrders.click();
  await expect(page).toHaveURL(/#\/my-orders$/);
  await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
  await menu.browseBooks.click();
  await expect(page).toHaveURL(/#\/browse-books$/);
  await expect(page.getByRole('heading', { name: 'Browse Books' })).toBeVisible();
});

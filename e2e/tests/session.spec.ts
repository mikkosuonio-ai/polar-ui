import { test, expect, CUSTOMER, LOGIN, failedCall } from './polar';

test('"Log In" sends the visitor to log in', async ({ page, api }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(LOGIN);
  expect(api.callsTo('GET', '/oauth2/authorization/keycloak')).toHaveLength(1);
});

// Every anonymous page load gets 401 on GET /user, which the interceptor only logs.
test('a 401 on /user leaves an anonymous visitor on the page', async ({ page, api }) => {
  const user = page.waitForResponse(r => r.url().endsWith('/user'));
  await page.goto('/#/browse-books');
  expect((await user).status()).toBe(401);
  await expect(page.getByRole('heading', { name: 'Browse Books' })).toBeVisible();
  // Give a redirect to the login page, which the interceptor would start at once, time to begin.
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/#\/browse-books$/);
  expect(api.callsTo('GET', '/oauth2/authorization/keycloak')).toHaveLength(0);
});

// Such as when the session has expired since GET /user.
test('a 401 on another call sends the visitor to log in', async ({ page, api, problems }) => {
  problems.allow(...failedCall('GET', '/orders', 401));
  api.user = CUSTOMER;
  api.fail('GET', '/orders', 401);
  await page.goto('/#/my-orders');
  await expect(page).toHaveURL(LOGIN);
});

import { test as base, expect, type ConsoleMessage, type Page, type Route } from '@playwright/test';

export { expect };

export type Book = { isbn: string; title: string; author: string; price: number; publisher?: string };
export type Order = {
  id: number; bookIsbn: string; bookName: string; bookPrice: number; quantity: number;
  status: 'ACCEPTED' | 'REJECTED' | 'DISPATCHED';
};
export type User = { username: string; firstName: string; lastName: string; roles: string[] };

// The users of the main repository's Keycloak realm.
export const CUSTOMER: User = { username: 'bjorn', firstName: 'Bjorn', lastName: 'Vinterberg', roles: ['customer'] };
export const EMPLOYEE: User = {
  username: 'isabelle', firstName: 'Isabelle', lastName: 'Dahl', roles: ['employee', 'customer'],
};

export const NORTHERN_LIGHTS: Book = {
  isbn: '1234567891', title: 'Northern Lights', author: 'Lyra Silverstar', price: 9.9, publisher: 'Polarsophia',
};
export const POLAR_JOURNEY: Book = {
  isbn: '1234567892', title: 'Polar Journey', author: 'Iorek Polarson', price: 12.9, publisher: 'Polarsophia',
};

// Where AuthService.login() sends the browser. edge-service would redirect it to Keycloak; the
// mock answers with a page of its own instead.
export const LOGIN = /\/oauth2\/authorization\/keycloak$/;

// A request the SPA made to the API, with its headers' names in lower case.
export type Call = { method: string; path: string; body: unknown; headers: Record<string, string> };

// The API as edge-service serves it, with the JSON shapes of edge-service's User and the
// services' Book and Order, kept in the browser test's memory. Each test starts with
// an anonymous visitor, NORTHERN_LIGHTS and POLAR_JOURNEY in the catalog, and no orders; a test
// changes these before it loads the page. Writes change them as the services would.
export class Api {
  user: User | undefined;
  books: Book[] = [{ ...NORTHERN_LIGHTS }, { ...POLAR_JOURNEY }];
  orders: Order[] = [];
  readonly calls: Call[] = [];
  private readonly failures = new Map<string, number>();

  // Answers METHOD PATH with STATUS and no body from now on.
  fail(method: string, path: string, status: number): void {
    this.failures.set(`${method} ${path}`, status);
  }

  // The calls made to METHOD PATH so far.
  callsTo(method: string, path: string): Call[] {
    return this.calls.filter(c => c.method === method && c.path === path);
  }

  async handle(route: Route): Promise<void> {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    this.calls.push({ method, path, body: request.postDataJSON(), headers: await request.allHeaders() });

    const failure = this.failures.get(`${method} ${path}`);
    if (failure) return route.fulfill({ status: failure });

    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });
    const isbn = /^\/books\/([^/]+)$/.exec(path)?.[1];
    const book = isbn ? this.books.find(b => b.isbn === isbn) : undefined;

    if (path === '/user' && method === 'GET') {
      return this.user ? json(this.user) : route.fulfill({ status: 401 });
    }
    if (path === '/books' && method === 'GET') return json(this.books);
    if (path === '/books' && method === 'POST') {
      const created = request.postDataJSON() as Book;
      this.books.push(created);
      return json(created, 201);
    }
    if (isbn && method === 'GET') return book ? json(book) : route.fulfill({ status: 404 });
    if (isbn && method === 'PUT') {
      const edited = request.postDataJSON() as Book;
      this.books = this.books.map(b => b.isbn === isbn ? edited : b);
      return json(edited);
    }
    if (isbn && method === 'DELETE') {
      this.books = this.books.filter(b => b.isbn !== isbn);
      return route.fulfill({ status: 204 });
    }
    if (path === '/orders' && method === 'GET') return json(this.orders);
    if (path === '/orders' && method === 'POST') {
      const { isbn: orderedIsbn, quantity } = request.postDataJSON() as { isbn: string; quantity: number };
      const ordered = this.books.find(b => b.isbn === orderedIsbn)!;
      const order: Order = {
        id: this.orders.length + 1, bookIsbn: ordered.isbn, bookName: `${ordered.title} - ${ordered.author}`,
        bookPrice: ordered.price, quantity, status: 'ACCEPTED',
      };
      this.orders.push(order);
      return json(order);
    }
    // The logout form's post, which edge-service would answer with a redirect to the SPA.
    if (path === '/logout' && method === 'POST') {
      return route.fulfill({ contentType: 'text/html', body: '<title>Logged out</title><h1>Logged out (mocked)</h1>' });
    }
    if (LOGIN.test(path) && method === 'GET') {
      return route.fulfill({ contentType: 'text/html', body: '<title>Log in</title><h1>Log in (mocked)</h1>' });
    }
    throw new Error(`No mock for ${method} ${path}`);
  }
}

// The requests that go to the API rather than to the SPA's files.
const API_PATHS = /^\/(user|books|orders|oauth2|logout)(\/|$)/;

// What a page does on every anonymous load: GET /user answers 401, and AppComponent, which
// subscribes to it without an error handler, logs the error.
const ANONYMOUS_USER = [
  /^HTTP 401 GET .*\/user$/,
  /^console: Failed to load resource: the server responded with a status of 401 .*\[.*\/user\]$/,
  /^Angular ERROR 401 .*\/user$/,
];

// Patterns for the problems a test expects of an HTTP call: its response with STATUS, the
// browser's console line for it, and the error Angular logs when nothing handles it.
export function failedCall(method: string, path: string, status: number): RegExp[] {
  const url = path.replace(/[/.?]/g, '\\$&');
  return [
    new RegExp(`^HTTP ${status} ${method} .*${url}$`),
    new RegExp(`^console: Failed to load resource: the server responded with a status of ${status} .*\\[.*${url}\\]$`),
    new RegExp(`^Angular ERROR ${status} .*${url}$`),
  ];
}

type Problems = { allow(...patterns: RegExp[]): void };

// Google Fonts: the SPA serves its fonts and icons itself (@fontsource/roboto, material-icons).
// The tests block Google's font hosts without allowing it, so a request to them fails the test.
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

export const test = base.extend<{ problems: Problems; api: Api }>({
  // Every test fails on a browser problem it doesn't expect: a response of 400 or more, a failed
  // request, an uncaught page error, or a console error.
  problems: [async ({ page }, use) => {
    const seen: string[] = [];
    const allowed = [...ANONYMOUS_USER];

    await page.route(FONTS, route => route.abort('blockedbyclient'));
    // Angular's ErrorHandler logs console.error('ERROR', error). Name an HttpErrorResponse by its
    // status and URL, in the page itself: after a redirect, the error object can't be read.
    await page.addInitScript(() => {
      const error = console.error.bind(console);
      console.error = (...args: any[]) => error(...args.map(a =>
        a?.name === 'HttpErrorResponse' ? `HttpErrorResponse ${a.status} ${a.url}` : a));
    });

    page.on('response', r => {
      if (r.status() >= 400) seen.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`);
    });
    page.on('requestfailed', r => {
      // Navigating away cancels the requests still running; that's no problem of the page.
      if (r.failure()?.errorText !== 'net::ERR_ABORTED') {
        seen.push(`request failed ${r.method()} ${r.url()}: ${r.failure()?.errorText}`);
      }
    });
    page.on('pageerror', e => seen.push(`page error: ${e.message}`));
    page.on('console', (m: ConsoleMessage) => {
      if (m.type() !== 'error') return;
      const angular = /^ERROR HttpErrorResponse (\d+) (\S+)$/.exec(m.text());
      seen.push(angular ? `Angular ERROR ${angular[1]} ${angular[2]}` : `console: ${m.text()} [${m.location().url}]`);
    });

    await use({ allow: (...patterns) => allowed.push(...patterns) });

    const unexpected = seen.filter(p => !allowed.some(a => a.test(p)));
    expect(unexpected, 'browser problems the test does not expect').toEqual([]);
  }, { auto: true }],

  // The mocked API, for every test: none of them reaches a backend.
  api: [async ({ page }, use) => {
    const api = new Api();
    await page.route(url => API_PATHS.test(url.pathname), route => api.handle(route));
    await use(api);
  }, { auto: true }],
});

// Opens the side menu and returns its links; links a user mustn't see aren't rendered at all.
export async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'Toggle sidenav' }).click();
  const menu = page.getByRole('navigation').getByRole('navigation');
  await expect(menu.getByRole('link', { name: 'Browse Books', exact: true })).toBeVisible();
  return {
    links: menu.getByRole('link'),
    browseBooks: menu.getByRole('link', { name: 'Browse Books', exact: true }),
    addBook: menu.getByRole('link', { name: 'Add Book', exact: true }),
    myOrders: menu.getByRole('link', { name: 'My Orders', exact: true }),
  };
}

// The card of the book with ISBN on the "Browse Books" page.
export function bookCard(page: Page, isbn: string) {
  return page.locator('mat-card.dashboard-card').filter({ hasText: `ISBN: ${isbn}` });
}

// Every card on the "Browse Books" or "My Orders" page.
export function cards(page: Page) {
  return page.locator('mat-card.dashboard-card');
}

// The card of the order with ID on the "My Orders" page.
export function orderCard(page: Page, id: number) {
  return page.locator('mat-card.dashboard-card').filter({
    has: page.locator('mat-card-title', { hasText: new RegExp(`^\\s*Order #${id}\\s*$`) }),
  });
}

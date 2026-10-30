import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Browser tests of the built SPA, with the API mocked in the browser (tests/polar.ts), so they
// need no backend. The full-stack browser tests are in mikkosuonio-ai/cloud-native-spring-in-action.
// From the project's root, with its packages installed (npm ci, or ./gradlew npmInstall):
//
//   npx playwright install chromium-headless-shell
//   npx ng e2e
//
// Paths in the settings below are relative to this directory, but UI_TEST_VISUAL's is relative
// to the current one.
//
// Environment:
//   UI_BASE_URL     the SPA to test, such as the image run with PORT=9004 at
//                   http://localhost:9004. Without it, Playwright serves ../dist/public, which
//                   `./gradlew buildAngular` builds, on PORT. The SPA routes by hash, so a static
//                   server is enough.
//   PORT            the port for ../dist/public (default 4300)
//   UI_TEST_CHANNEL an installed browser to use instead of Playwright's own Chromium, such as
//                   chrome for Google Chrome, which needs no `npx playwright install`
//   UI_TEST_OUTPUT  directory for traces and screenshots of failed tests (default test-results)
//   UI_TEST_JUNIT   also write the results to this file with the JUnit reporter
//   UI_TEST_REPORT  also write the HTML report to this directory
//   UI_TEST_VISUAL  run only the @visual tests (tests/screens.spec.ts) instead, which save a
//                   screenshot and an axe-core report of each main page to this directory, such
//                   as plan/screens/v22
const port = Number(process.env.PORT ?? 4300);
const baseURL = process.env.UI_BASE_URL ?? `http://127.0.0.1:${port}`;
const dist = join(__dirname, '..', 'dist', 'public');

if (!process.env.UI_BASE_URL && !existsSync(join(dist, 'index.html'))) {
  throw new Error(`No ${dist}/index.html: run ./gradlew buildAngular first, or set UI_BASE_URL`);
}

export default defineConfig({
  testDir: 'tests',
  outputDir: process.env.UI_TEST_OUTPUT ?? 'test-results',
  fullyParallel: true,
  // Two CPUs on the development server and on GitHub's runners.
  workers: 2,
  forbidOnly: !!process.env.CI,
  ...(process.env.UI_TEST_VISUAL ? { grep: /@visual/ } : { grepInvert: /@visual/ }),
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ...(process.env.UI_TEST_JUNIT ? [['junit', { outputFile: process.env.UI_TEST_JUNIT }] as const] : []),
    ...(process.env.UI_TEST_REPORT
      ? [['html', { outputFolder: process.env.UI_TEST_REPORT, open: 'never' }] as const]
      : []),
  ],
  use: {
    baseURL,
    browserName: 'chromium',
    channel: process.env.UI_TEST_CHANNEL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.UI_BASE_URL ? undefined : {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory "${dist}"`,
    url: baseURL,
    reuseExistingServer: false,
    // Its log of each request. Playwright itself reports a port already in use.
    stderr: 'ignore',
  },
});

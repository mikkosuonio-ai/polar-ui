# Future work

What's left after the update to Angular 22 and Node.js 24 (v1.3.0 to v2.1.1, 2026-10-29 and 30).
The update's plan, with its decisions and how the run went, is in the git history:
`git show fbf8cec:plan/angular-update.md`.

## Left from the update

- **Zoneless, OnPush and signals.**
  - The components use `ChangeDetectionStrategy.Eager`, which Angular 22's migration set, and zone.js stays, with `provideZoneChangeDetection()` in `main.ts`.
  - Going zoneless needs signals, or `markForCheck`, wherever a `subscribe` callback sets a field.
  - Then:
    - turn the lint rule `prefer-on-push-component-change-detection` back on (it's off in `eslint.config.js`);
    - use `input()` and `output()` in place of `@Input` and `@Output`;
    - use `styleUrl` in place of `styleUrls`.
- **Material 3.** The M2 prebuilt theme `indigo-pink` still ships with Material 22, but it's deprecated. M3 changes the look:
  - take screenshots before and after it with `UI_TEST_VISUAL` (`e2e/tests/screens.spec.ts`);
  - compare them with `plan/screens/v22`.
- **Node.js 26.**
  - Node.js 26 has been Active LTS since 2026-10-28, until 2029-04-30, and Angular 22 accepts it (`>=26`).
  - Node.js 24 is in maintenance until 2028-04-30.
  - The move changes `version` in `build.gradle` and `.nvmrc`.
- **The moderate axe findings** on the main pages (`plan/screens/v22/*.axe.json`):
  - content outside landmarks;
  - no h1 on the book forms;
  - the nested navigation landmarks.

  `e2e/tests/accessibility.spec.ts` fails only on serious and critical findings.
- **Raising the builder pin**, `paketobuildpacks/builder-jammy-base:0.4.673`, in CI's `BUILDER` and the README.
  - The image scan after the update had 140 open alerts (3 critical, 72 high), all in its Ubuntu 22.04 packages and nginx 1.31.6. None of the nginx ones apply to `nginx/nginx.conf`.
  - Raising the pin waits for a builder release with the nginx buildpack's nginx 1.31.7.
- **Angular 23**, expected around 2027-06. Angular 22 is active until 2027-06 and has LTS until 2028-06.

## From the review of the update (2026-10-30)

The review's other findings are fixed in v2.1.1. These were left:

- **Bundle headroom.** The initial bundle is 893 kB against the 900 kB warning budget. Loading the routes with `loadComponent` would make room before the next feature, instead of raising the budget.
- **Spec setup that does nothing:**
  - `NO_ERRORS_SCHEMA` in the component specs: TestBed's schemas don't reach a standalone component's template;
  - the specs' extra `FormsModule` imports;
  - `compileComponents()`, which the unit-test builder doesn't need.
- **Unit tests for v2.1.0's error handling.** Only the e2e tests cover the snack bars and the "can't be loaded" messages of `AddNewBookComponent`, `EditBookComponent`, `BookListComponent`, `OrderListComponent` and `OrderDialogComponent`.
- **`.browserslistrc`** is in the inputs of `testAngular` and `buildAngular` in `build.gradle`, but there's no such file.
- **Type-checking the e2e tests.** No build checks them, since Playwright only transpiles.
  - Under TypeScript 6 the root `tsconfig.json` includes no `@types`, so Node's (`process`, `__dirname`, `node:fs`) are missing there.
  - `@axe-core/playwright`'s `Page` type differs from `@playwright/test`'s (`getByRef`, `webmcp`).
  - The fix would be an e2e tsconfig with `types: ["node"]`, and matching Playwright versions.
- **Cosmetics:**
  - mis-indented closing lines in the service and interceptor specs;
  - repeated `@angular/core` imports in `book-form.component.ts` and `app.component.ts`;
  - `node_modules/` in `e2e/.gitignore`, though e2e has no packages of its own;
  - both a `placeholder` and a `mat-label` on the order dialog's quantity field;
  - the unused `AuthService.logout()` and `AppComponent.title`.

## Note on local verification

The full-stack smoke run (`smoke-test.sh all ui` in the main repository) barely fits this server's memory. At v2.1.1, with about 1 GB held by other Claude sessions, a different browser test timed out in each run because the machine stalled. Only CI's run was clean.

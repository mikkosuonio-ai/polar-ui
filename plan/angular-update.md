# Plan: update polar-ui to Angular 22 and Node.js 24

Approved by the user on 2026-10-29.

## Context

polar-ui runs on Angular, CDK and Material 13.2.6, TypeScript 4.4, zone.js 0.11 and Node.js 16.14.0, and all of them are out of support. The fork's first scans (2026-10-28) found:
- 23 advisories in Angular 13.2.6;
- about 620 in build tools: Go 1.17 in esbuild's binaries, and the Node.js 16.14.0 that Gradle downloads.

The goal is a supported Angular and a Node.js LTS, one major version at a time, with each step verified:
- by the fork's unit and e2e tests;
- at release points, by the main repository's full-stack browser tests against a local image.

The app should behave the same throughout. Only Material's MDC components change the look, at one step and one release. The main repository follows each release with a tag bump after its browser tests pass. Its own Spring Boot 3 update is independent of this one.

Facts checked on 2026-10-29 against angular.dev/reference/releases and /versions, the angular-cli and angular/components changelogs and migration collections, the npm registry, github.com/nodejs/Release and plugins.gradle.org.

## Decisions

- **Target: Angular 22.2.x** (Material/CDK 22.2.x, CLI 22.2.5).
  - Released 2026-06-03; active until 2027-06, LTS until 2028-06.
  - Angular now ships one major a year, so v23 is expected around 2027-06.
  - v21 has LTS until 2027-06. v20's LTS ends 2026-11-28, and v19 and older are out of support.
  - Only 22.x has every client-side fix: the XSRF token leak and its incomplete fix (GHSA-58c5…, GHSA-jfgx…), the SVG, i18n and host-binding XSS fixes, and the `formatDate`/`digitsInfo` DoS fixes.
- **Node.js 24** (24.x, at least 24.15, which Angular 22 needs), chosen by the user.
  - Maintenance LTS until 2028-04-30.
  - Same as `e2e/.nvmrc`.
  - Node 26 (Active LTS since 2026-10-28, until 2029-04-30) can follow later as a small step of its own.
- **Theme: keep the M2 prebuilt `indigo-pink`** (user's choice).
  - Still shipped in Material 22, but marked deprecated.
  - Moving to Material 3 is a separate decision for later.
- **After the update:** standalone components (user's choice), then `angular-eslint`.
- **Keep zone.js.** Zoneless needs signals or `markForCheck` wherever a `subscribe` callback sets a field.
- **Kept on the way:**
  - the 401 interceptor, as a class-based interceptor through `withInterceptorsFromDi()`;
  - `useHash` routing.
- **Unit tests move to Vitest with jsdom at Angular 22,** through its `migrate-karma-to-vitest` migration.
  - Karma isn't deprecated by Angular, but the `karma` package is no longer maintained.
  - Vitest is the default for new apps from 21.
  - jsdom needs no Chrome and less memory. Vitest's browser mode (Playwright Chromium) is the fallback.

### Node.js and TypeScript per major (`engines` of `@angular/core`)

| Angular | Node.js | TypeScript | zone.js | Build's Node.js |
|---|---|---|---|---|
| 14 | ^14.15 \|\| ^16.10 | 4.6–4.8 | ~0.11.4/0.12 | 16.14.0 |
| 15 | ^14.20 \|\| ^16.13 \|\| ^18.10 | 4.8 | ≤0.13 | 16.14.0 |
| 16 | ^16.14 \|\| ^18.10 | 4.9.3–5.1 | ~0.13 | 16.14.0 |
| 17 | ^18.13 \|\| ^20.9 | 5.2–5.4 | ~0.14 | **20.x** |
| 18–19 | ^18.19.1 \|\| ^20.11.1 \|\| ^22 | 5.4–5.8 | 0.14.10/0.15 | 20.x |
| 20–21 | ^20.19 \|\| ^22.12 \|\| ^24 | 5.8–5.9 | 0.15/0.16 | **24.x** |
| 22 | ^22.22.3 \|\| ^24.15 \|\| >=26 | 6.0 | 0.15/0.16 | 24.x (≥24.15) |

- Node 24 isn't accepted before Angular 20, and Node 16 isn't accepted from 17, so the build's Node.js moves twice:
  - at Angular 17, to the latest 20.x. It is out of support, but used only at build time and only for three steps.
  - at Angular 20, to 24.
- rxjs 7.4 is accepted by every major.

## How the run works (the user's instructions, 2026-10-29)

- **No approval needed** for intermediate commits, pushes to `mikkosuonio/development`, or smoke runs, including stopping MicroK8s for a run and starting it again afterwards if it was running.
- **Never skip a verification step, even when memory is short.**
  - Before each heavy task, check `free -h`.
  - If too little is available, wait: a Monitor until-loop on `free -m`, checking every minute.
  - If enough doesn't come free within an hour, notify the user (PushNotification) and keep waiting.
  - What each task needs is roughly:

    | Task | Available memory needed |
    |---|---|
    | webpack build or Karma run | 1.5 GB |
    | esbuild build, Vitest, e2e or `pack` | 1 GB |
    | smoke run | whatever its script asks, with MicroK8s stopped |

- **The context size.** The status line gets `context_window.used_percentage` but doesn't keep it.
  - Approving this plan approves one change outside the repository: `~/.claude/statusline.sh` also writes the percentage to `~/.cache/claude-context/<session_id>`.
  - I read that file after every step and at every wait.
  - Above 60%: pause, notify the user, and wait for the user or a timed compaction.
  - If the file doesn't update, I estimate from the session transcript instead, and tell the user that it's an estimate.
- **Release points** (v1.3.0, v1.4.0, v2.0.0, v2.1.0), in this order:
  1. local verification and the local smoke run;
  2. tag `v*` and push; the fork's CI publishes `ghcr.io/mikkosuonio-ai/polar-ui:<tag>`;
  3. `SendMessage` to the main repository's session `polar-ui-mocked-e2e-tests`, whose cwd is that repository's development worktree, asking it to:
     - bump the pins: `PolarBookshop/polar-deployment/docker/docker-compose.yml` and the two `kubernetes/…/polar-ui.yml`;
     - make any test changes from the table below;
     - push, and report its CI result (the edge `ui` job);
  4. watch that run myself too, read-only (`gh run list/view -R mikkosuonio-ai/cloud-native-spring-in-action`);
  5. on success, notify the user and pause until they answer.
  - If the session can't be reached (offline, or its messages held for approval):
    - its CI can't be made to use the new image without a commit there, since `workflow_dispatch` has no inputs and the image is pinned in its files, and this session makes no changes in that repository;
    - so notify the user and pause.
- **Memory to save once the plan is approved:**
  - these approvals, as a project memory;
  - never skipping verification for lack of resources, and the 60% context limit, as feedback memories.

## General rules for every step

- **Order:**
  - `ng update @angular/core@N @angular/cli@N`, then `ng update @angular/material@N` (which brings the CDK);
  - then the TypeScript, zone.js, `@types/*` and Karma/Jasmine versions the major needs, where `ng update` didn't move them;
  - then the fixes by hand.
- **Commits:**
  - one commit per major ("build: Update Angular to N");
  - optional migrations (MDC, `application` builder, control flow, Vitest, standalone, eslint) get commits of their own;
  - Node.js moves share the commit of the major that needs them.
- **Majors can't be combined:** `ng update` goes one major at a time (angular.dev/reference/releases). Several majors can share one release.
- **Peer conflicts:**
  - no `--force` and no `--legacy-peer-deps` unless a step proves it needs one, with the reason in the commit message;
  - after a failed `ng update`, `git checkout -- package.json package-lock.json` and run `npm ci`.
- **Release notes** for each release go in the README's fork section.

## Steps

### 0. Preparation, on Angular 13 and Node.js 16 → release v1.3.0

1. **Cleanup** (`chore`):
   - delete `src/app/fake-data.ts` (finding 41);
   - set `<title>` in `src/index.html` to "Polar Bookshop";
   - remove `MatRadioModule` from `app.module.ts` (imported, never used) and the `.mat-radio-button` rule from `book-form.component.css`, which leaves the MDC migration less to do.
2. **`com.github.node-gradle.node` 3.2.0 → 7.1.0** (2024-09-27, the latest; needs Gradle ≥ 6.6, and the wrapper is 8.5).
   - The changelog says to skip 4.0.0.
   - `download = true`, `version = …` and NpxTask's `command`/`args` stay as they are.
   - 7.0's default Node.js (18.17.1) doesn't apply, since `version` is set.
   - npm ≥ 7 is required; Node 16.14.0 brings npm 8.
3. **CSRF and interceptor tests in `e2e/`** (mocked), so that the fork itself guards what changes at steps 6 and 10. Each case is added unless it's already covered:
   - a write (POST/PUT/DELETE) sends `X-XSRF-TOKEN` equal to the `XSRF-TOKEN` cookie;
   - a GET doesn't send it;
   - requests carry `X-Requested-With: XMLHttpRequest`;
   - the logout form posts `_csrf` with the cookie's value;
   - a 401 on anything but `/user` goes to `/oauth2/authorization/keycloak`.
4. **Fonts and icons hosted by the app:**
   - `@fontsource/roboto` (5.3.x, OFL-1.1; weights 300/400/500) and `material-icons` (1.13.x, Apache-2.0) go into the `styles` of `angular.json` (build and test);
   - the Google Fonts `<link>`s leave `index.html`.
   - Why:
     - the production build inlines Google's font CSS and needs the network for it. It still does with the `application` builder (`optimization.fonts.inline` defaults to true, and an offline build fails with "Inlining of fonts failed");
     - the page stops depending on Google.
   - `MatIcon`'s default font set class `material-icons` works with the package without configuration.
   - Doing it before the baseline means the baseline shows real icons.
   - The tests' blocking of the font hosts then blocks nothing.
5. **Baseline of the look and accessibility** (not gating):
   - `e2e/tests/screens.spec.ts`, tagged `@visual` and run only with `UI_TEST_VISUAL=1` (`grep`/`grepInvert` in `playwright.config.ts`);
   - full-page screenshots at a fixed viewport, plus an axe-core report (`@axe-core/playwright`) per page:
     - anonymous Browse Books;
     - the menu open as an employee;
     - Add Book;
     - Edit Book;
     - the order dialog;
     - My Orders;
     - the spinner on a held `GET /books/{isbn}`.
   - The PNGs and the axe JSON go under `plan/screens/v13/`, committed as the record of the look before the update.
   - **Visual and accessibility checks in the e2e suite:**
     - screenshot assertions (`toHaveScreenshot`) don't become gating tests: CI uses the runner's Google Chrome and this server uses Playwright's Chromium, so pixels differ;
     - the screenshots stay an on-demand comparison, re-run at steps 3 and 11;
     - axe checks become gating after step 11, once the MDC DOM is final: no serious or critical violations, each known exception listed with its reason.

### 1. Angular 14 (Node.js 16.14.0)

- **Migrations:**
  - `remove-default-project-option` removes `defaultProject`;
  - `update-tsconfig-target` sets ES2020;
  - the typed-forms migration does nothing here (`ngModel` only).
- **By hand:** TypeScript ~4.7/4.8.

### 2. Angular 15 (Node.js 16.14.0)

- **Migrations:**
  - `update-karma-main-file` takes the `require.context` out of `src/test.ts`;
  - `update-typescript-target` sets ES2022 with `useDefineForClassFields: false`;
  - Material's `ng update` rewrites imports to `@angular/material/legacy-*` (no look change).
- **By hand:**
  - move polyfills into `angular.json`: build `["zone.js"]`, test `["zone.js", "zone.js/testing"]`;
  - delete `src/polyfills.ts` and `src/test.ts`, and drop them from the tsconfigs;
  - this removes the `zone.js/dist/zone` imports before zone.js 0.14 (Angular 17) forbids them;
  - TypeScript ~4.8.

### 3. Material MDC components (Angular 15)

- Run `ng generate @angular/material:mdc-migration` for every component, and fix what it marks `TODO(mdc-migration)`.
- **What it renames:** `.mat-card-header` → `.mat-mdc-card-header` (`book-form.component.css`) and `.mat-spinner` → `.mat-mdc-progress-spinner` (`edit-book.component.css`).
- **By hand:**
  - **Form fields:**
    - the default appearance becomes `fill`;
    - a placeholder no longer becomes a floating label;
    - so the five `book-form` fields get `<mat-label>`s (ISBN, Title, Author, Publisher, Price), which keeps their labels and accessible names.
  - **Spinner:** its host is no longer `display: block`, so `margin: auto` no longer centres it. It gets `display: block`.
  - **Book and order cards:**
    - check the `dashboard-card` padding, which has moved to the header, content and actions;
    - check the absolutely positioned `.more-button` (icon buttons grow from 40 to 48 px);
    - check whether the taller MDC list items still fit the grid's 400/380 px rows, and change `rowHeight` if not.
  - **Dialog:** padding has moved into `mat-dialog-content`; check the order dialog.
  - **Typography:** `.mat-h1` and `mat-typography` still come with the `indigo-pink` prebuilt theme.
- **Unchanged:** grid list, sidenav, toolbar and icon aren't reimplemented on MDC.
- **Selectors the tests rely on stay in Material's source:**
  - the `mat-card` and `mat-card-title` elements;
  - `<mat-spinner>` (selector `mat-progress-spinner, mat-spinner`);
  - `mat-nav-list`'s `role="navigation"`, which the nested `getByRole('navigation')` relies on;
  - the dialog title as the dialog's name.
  - They are confirmed by running the tests, not by reading.
- **Unit tests:** fix any spec that queries `.mat-*` classes.
- **Then:** re-run the screenshots and axe against `plan/screens/v13/`, save them as `plan/screens/mdc/`, and list the visible changes for the release notes.

### 4. Angular 16 (Node.js 16.14.0) → release v1.4.0, the MDC look

- TypeScript ~5.1 and zone.js ~0.13.
- No legacy imports may be left (Angular 17's `ng update` refuses them).
- **For users:**
  - the new look: spacing, filled form fields with floating labels, bigger icon buttons, menus and dialogs;
  - no change in behaviour.

### 5. Angular 17, Node.js → 20.x

- `build.gradle`: `version` = the latest 20.x.
- **Packages:** zone.js ~0.14; TypeScript ~5.4.
- **By hand:** `browserTarget` → `buildTarget` in `serve` and `extract-i18n` (deprecated in 17, removed in 19).
- **Material 17:** removes the legacy components, so `ng update` checks that none are left.
- Keep `@if`/`@for` for step 8.

### 6. Angular 18 (Node.js 20) → smoke checkpoint, no tag

- **HttpClientModule:** the `migration-http-providers` migration replaces it with `provideHttpClient(withInterceptorsFromDi())` in `AppModule`'s providers.
  - The `HTTP_INTERCEPTORS` provider stays.
  - XSRF stays on by default: `withXsrfConfiguration` isn't needed for the default cookie and header names.
  - `HttpXsrfTokenExtractor` (`AppComponent`, `AuthService`) stays injectable.
  - Check the specs, where `HttpClientTestingModule` becomes `provideHttpClient()` with `provideHttpClientTesting()`.
- **Material 18:**
  - the `m2-` Sass renames don't apply, since only prebuilt CSS is used;
  - M3 stays out.
- **In its own commit, `ng update @angular/cli --name use-application-builder`** (esbuild; recommended in 18–22):
  - `main` → `browser`; `buildOptimizer` and `vendorChunk` go.
  - **Output:**
    - `outputPath: { "base": "dist", "browser": "public" }`, so `dist/public` stays as it is for `nginxConfig` (`into "dist"`), `nginx.conf`'s `root public`, `pack --path dist`, CI and `e2e/playwright.config.ts`;
    - `3rdpartylicenses.txt` moves to `dist/`, which is in the image but no longer served;
    - `nginxConfig` runs after the build (`finalizedBy`), so deleting `dist` before each build loses nothing.
  - Karma stays on `@angular-devkit/build-angular:karma` (webpack) until step 10.
  - Write down bundle sizes for the budgets.
- **Checkpoint:** main repository's smoke run with the local image. No tag, so no CI run there.
  - It's worth doing because the HTTP layer and the build system both changed.

### 7. Angular 19 (Node.js 20)

- **Migrations:** `explicit-standalone-flag` adds `standalone: false` to the seven declared components.
- **Packages:** TypeScript ~5.8; zone.js ~0.15.

### 8. Angular 20, Node.js → 24.x

- `build.gradle`: `version` = the latest 24.x (≥ 24.15).
- **Migrations:**
  - `update-module-resolution` sets `bundler`;
  - `test-bed-get` and `inject-flags` (not used).
- **Control flow:** `ng generate @angular/core:control-flow` (`*ngIf`/`*ngFor` are deprecated in 20) in a commit of its own. The DOM doesn't change, only its comments.
- **Deprecated but kept until the standalone step:**
  - `platformBrowserDynamic` (→ `platformBrowser`);
  - `@angular/animations` and `BrowserAnimationsModule` (deprecated in 20.2; removal planned for 23).

### 9. Angular 21 (Node.js 24)

- **Migrations:**
  - the zone migration adds `provideZoneChangeDetection()` to `AppModule`, since 21 no longer provides zone change detection by default. If it doesn't, the page stops updating, and the e2e tests fail at once.
  - `update-typescript-lib` sets es2022;
  - control flow is already done.
- **Material 21** removes `MatCommonModule` and `*Animations` (not used).
- **Packages:** TypeScript ~5.9.

### 10. Angular 22 (Node.js 24) → release v2.0.0

- **Migrations:**
  - `change-detection-eager` marks every component Eager, to keep today's change detection now that OnPush is the default;
  - `strictTemplates` is already true;
  - `http-xhr-backend` (nothing uses `HttpXhrBackend`).
- **Fetch is HttpClient's default backend from 22.**
  - XSRF and the interceptor are backend-independent; the CSRF tests from step 0 check this.
  - The way back is `provideHttpClient(withInterceptorsFromDi(), withXhr())`.
- **Check:** `?.` now gives `undefined` (the templates have none); `paramsInheritanceStrategy` defaults to `always` (the routes are flat).
- **Packages:** TypeScript ~6.0.
- **Vitest,** in its own commit: the optional `migrate-karma-to-vitest` migration (or `ng g @schematics/angular:refactor-jasmine-vitest` for the specs).
  - Runs in jsdom.
  - **JUnit:** the `junit` reporter writes to `build/test-results/testAngular/TEST-vitest.xml`, for CI's summary script.
  - **`testAngular`:** args become `test --watch=false`; inputs lose `karma.conf.js`.
  - **Removed:** `karma.conf.js`, Karma, Jasmine and their `@types`, and CI's comment about CHROME_BIN.
  - **Then `@angular-devkit/build-angular` goes,** leaving only `@angular/build`, so webpack leaves `node_modules`.
- **e2e joins the root `package.json`,** in its own commit:
  - `@playwright/test` becomes a root devDependency;
  - `playwright.config.ts` moves to the root and `tests` to `e2e/`, with the same environment variables;
  - one `.nvmrc` (24) and one lockfile; CI's setup-node and `npm ci` point at the root.
  - **`ng e2e`:** `ng add playwright-ng-schematics` (22.x; supports Angular 18+). Use its builder `playwright-ng-schematics:playwright` without `devServerTarget`, so the tests run against `dist/public` or `UI_BASE_URL` as today.
    - If the builder can't keep that, `npm run e2e` (`playwright test`) without the schematic.
  - Gradle's `npmInstall` then also installs `@playwright/test`, without browsers.
  - README updated: one Node.js for build and e2e.
- **Release v2.0.0.** For users:
  - nothing visible beyond v1.4.0;
  - HTTP goes through fetch.
  - The new major marks the new build: Node 24, esbuild, Vitest.

### 11. After the update

1. **Standalone:** `ng generate @angular/core:standalone`, all three modes in order: convert, prune NgModules, standalone bootstrap.
   - `main.ts` becomes `bootstrapApplication(AppComponent, { providers: [provideZoneChangeDetection(), provideRouter(routes, withHashLocation()), provideHttpClient(withInterceptorsFromDi()), { provide: HTTP_INTERCEPTORS, … }] })`.
   - `AppModule` and `AppRoutingModule` go. So do `enableProdMode`, `environments/` and `fileReplacements`, if nothing but `main.ts` uses them.
   - **Animations:** drop `BrowserAnimationsModule`/`NoopAnimationsModule` and `@angular/animations` if Material 22's dialog, menu and sidenav no longer need them; otherwise use `provideAnimationsAsync()`. Unknown until tried.
2. **angular-eslint 22.x:** `ng add angular-eslint` (flat config, ESLint 9/10).
   - `lintAngular` comes back in `build.gradle`, with a CI step before the unit tests.
   - **Expected fixes:**
     - `no-output-on-prefix`: `book-form`'s `onSubmit` output gets a new name, and its templates and specs change with it;
     - `prefer-inject`, with `ng g @angular/core:inject`;
     - rxjs's deprecated `tap(next, error)` in `http.interceptor.ts` becomes `tap({ error })`.
3. **Budgets:**
   - the `initial` budget is set from the measured size: the defaults of 500 kB warning and 1 MB error if it fits, otherwise just above it;
   - `anyComponentStyle` gets the default 4/8 kB.
4. **Gating axe check** in the e2e tests (see step 0). Screenshots re-taken into `plan/screens/v22/`.
5. **Release v2.0.1** if anything here reached the image; otherwise this all goes into v2.1.0.

### 12. Findings and small issues → release v2.1.0

These come after the update, not during it:
- they change behaviour, and the update's verification relies on "only the look changes";
- written once against the final APIs (standalone, control flow, MDC `MatSnackBar`), they don't have to be ported across nine majors.

- **39, HTTP errors:**
  - an error callback with a message for every call (`MatSnackBar`, and on the edit page in place of the spinner), matching `/can't be loaded|cannot be loaded|try again/i`;
  - e2e tests for the failing writes;
  - the edit page test loses its `test.fail` (`e2e/tests/employee.spec.ts:65`).
  - `AppComponent`'s `authenticate()` gets an error callback, which ends the anonymous `GET /user` 401 Angular `ERROR` in the console.
- **The spinner:** `books`/`orders` start `undefined`, not `[]`, so the spinner shows while loading.
- **40, totals:** `currency` pipe instead of `toPrecision(4)`. `e2e/tests/orders.spec.ts:44` changes from `$9.900` to `$9.90`; the other totals stay the same.

## What the main repository's browser tests need, per release

Made in that repository by its own session. Selector changes go into both copies of the helpers: `development/ui-test/tests/polar.ts` there and `e2e/tests/polar.ts` here.

| Release | Change | Main repository |
|---|---|---|
| v1.3.0 | Fonts and icons served by the app; title | Nothing breaks. Optional, in both `polar.ts` copies: drop the `FONTS` route and its allow pattern, which now block nothing. |
| v1.4.0 | MDC components | Expected: no selector changes. `mat-card.dashboard-card`, `mat-card-title`, `mat-spinner`, the nested navigation, the textbox and spinbutton names, the dialog name and the menu items are all kept. If a step breaks one, its fix is listed here for both copies. |
| v2.0.0 | HTTP through `provideHttpClient` and fetch | No test changes. **What the SPA sends:** `X-XSRF-TOKEN` = the **raw** value of the `XSRF-TOKEN` cookie, on POST/PUT/DELETE to relative URLs, plus `X-Requested-With: XMLHttpRequest`; the logout form posts the same raw value as `_csrf`. Under Spring Security 6, edge-service has to accept raw tokens; that is its concern. `02-employee` and `04-session` cover it. |
| v2.1.0 | 39, the spinner, 40 | Check `05-outages`: a write during a catalog outage now shows a message. The anonymous `/user` 401 `ERROR` allowance can go from both copies. `03-customer`'s `$19.80` is unchanged. 38's edit page test can rely on 39's message. |

## Verification at every step

Before each heavy task: run `free -h`, run one heavy task at a time, and size the work to the available memory. Another session's dependency update may be running, and the smoke script's lock doesn't cover builds. Afterwards: `./gradlew --stop`, remove the containers and stop the Podman socket if it was started.

1. **Unit tests and build:**
   - `./gradlew testAngular` and then `./gradlew buildAngular` (with `CHROME_BIN=~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` while Karma is in use);
   - expect 35 or more tests passing, and no budget errors;
   - write down the bundle sizes.
2. **e2e against `dist/public`:** `npx playwright test` with Node.js 24, from `e2e/` until step 10 and from the root after it.
3. **e2e against a local image:**
   - `DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock`;
   - `pack build localhost/polar-ui:dev --builder paketobuildpacks/builder-jammy-base:0.4.673 --buildpack paketo-buildpacks/nginx --path dist --docker-host=inherit`;
   - `podman run -d --name polar-ui -p 9004:9004 -e PORT=9004 localhost/polar-ui:dev`;
   - `UI_BASE_URL=http://localhost:9004 npx playwright test`;
   - `podman rm -f polar-ui`.
4. **At steps 3 and 11:** screenshots and axe compared with the baseline.
5. **CI** after each push the user approves:
   - unit tests, image build, e2e against the image;
   - code-scanning results, through `gh api`.
6. **Release points (v1.3.0, v1.4.0, v2.0.0, v2.1.0, and the checkpoint at step 6):**
   - stop MicroK8s for the memory, and start it again afterwards if it was running;
   - run `SMOKE_POLAR_UI_IMAGE=localhost/polar-ui:dev bash development/script/smoke-test.sh all ui` from a worktree of the main repository, `/home/ai/devel/cloud-native-spring-in-action/.claude/worktrees/development` (`/home/ai/devel/cloud-native-spring-in-action` itself has only `.git` and `.claude`; the script runs "from anywhere inside a worktree" and takes the shared lock);
   - then follow the release sequence in "How the run works": tag, the main repository's CI through its session, then notify and pause.

## Backing out of a step

- **Before pushing:** each step is its own commit(s), so drop it with `git reset --hard <previous>`, with the user's go-ahead, or `git revert` it once pushed. Then `rm -rf node_modules .angular` and `npm ci`, or let `npmInstall` reinstall.
  - `build.gradle`'s Node.js version goes back with the commit.
  - Never a bare `git stash`.
- **Released:** the main repository stays on its previous tag until it bumps, and a bad release is superseded by a fix release, not deleted.
- **Ways back inside a step:**
  - `withXhr()` for fetch;
  - Vitest's browser mode for jsdom;
  - `outputPath` base `dist/public` with `browser: ""` if `browser: "public"` misbehaves;
  - leaving `ng e2e` out.

## Risks and unknowns until tried

- **Old majors:** `ng update` of 13–16 against today's npm registry may hit peer-dependency conflicts.
- **Memory:** webpack builds (13–17) and `npm install` use the most memory.
- **The MDC layout:** card heights in the fixed grid rows, the more-button position, dialog spacing, and roles or names the tests depend on (confirmed only by running them).
- **The `application` builder:** whether `browser: "public"` works; esbuild's CSS handling of `@fontsource` and `material-icons` URLs (they go to `media/`).
- **Unchanged change detection:** whether the 21 zone migration and the 22 Eager migration leave it as it is.
- **Fetch vs XHR:** differences on redirects and 401s (the session expiry test).
- **Vitest on jsdom:** behaviour of CDK overlay, dialog and `BreakpointObserver`; whether CI's summary script reads Vitest's JUnit format.
- **Animations:** whether Material 22 still needs `@angular/animations`, which is to be removed in 23.
- **`playwright-ng-schematics`:** what it rewrites, and whether its builder can run without a dev server.
- **The scanner:** it may misread esbuild's `go.mod` (`go 1.13`, kept for source compatibility) as an old Go.
  - Releases are built with Go 1.26; esbuild 0.28.x comes with Angular 20–22.

## The scans after the update

- **Expected to clear:** all 23 Angular advisories, and the build tools' findings: esbuild with Go 1.17, webpack's tree, Node.js 16.14.0.
- **Expected to remain:**
  - **nginx 1.31.6 in the image:** 3 critical, 1 high, 1 medium, none applying to `nginx/nginx.conf`. This waits for a `builder-jammy-base` release with the nginx buildpack's 1.31.7; then the `0.4.673` pin goes up.
  - **Ubuntu 22.04 packages:** 132 alerts, none critical or high.
  - Whatever is open by then against Node.js 24.x and the new dev toolchain (Vite, Vitest, ESLint), which should be few.
- The scans after each release are compared with the 2026-10-28 baseline in the README's release notes.

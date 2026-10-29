# Polar UI

This application is part of the Polar Bookshop system and provides the frontend functionality. It's part of the project built in the [Cloud Native Spring in Action](https://www.manning.com/books/cloud-native-spring-in-action) book by [Thomas Vitale](https://www.thomasvitale.com).

## About this fork

This is a fork of [PolarBookshop/polar-ui](https://github.com/PolarBookshop/polar-ui), used by
[mikkosuonio-ai/cloud-native-spring-in-action](https://github.com/mikkosuonio-ai/cloud-native-spring-in-action),
which tests it as part of the whole system.

Differences from the original:
- The image is built with `paketobuildpacks/builder-jammy-base` (Ubuntu 22.04), pinned to a
  version, instead of the deprecated `paketobuildpacks/builder:base` (Ubuntu 18.04). Its nginx
  runs as a user who can't write to `/workspace`, so `nginx/nginx.conf` puts nginx's temporary
  files in the buildpack's `{{ tempDir }}`.
- The unit tests run headless in the build (`testAngular`), and the workflow runs them before
  it builds the image.
- angular-eslint lints the code and templates (`./gradlew lintAngular`, and in the workflow),
  in place of tslint and codelyzer.
- The SPA serves its fonts and icons itself (`@fontsource/roboto`, `material-icons`, under
  `media/`) instead of loading them from Google Fonts, so neither the page nor the build depends
  on Google. edge-service lets `/media/**` through from the main repository's 1e5acf6 on.
- Playwright e2e tests in `e2e/` replace Protractor, run with `ng e2e`
  (`playwright-ng-schematics`). They mock the API in the browser, and the workflow runs them
  against the image it has just built, before it publishes the image.
- The workflow publishes the image as `ghcr.io/mikkosuonio-ai/polar-ui`: `sha-<commit>` for
  each push to `mikkosuonio/development`, and the tag's name alone for each `v*` tag on that
  branch. A `v*` tag elsewhere fails the workflow.

### Releases

The update to Angular 22 and Node.js 24 is planned in
[`plan/angular-update.md`](plan/angular-update.md).

- **v2.1.0** (Angular 22): failed HTTP calls say so. A failed load of the books, the orders or
  the book to edit shows "… can't be loaded. Please try again later." in place of the list,
  and a failed create, update, remove or order shows a snack bar ("… Please try again.").
  The spinner shows while the lists load. Order totals are in dollars and cents ($9.90,
  $1,234.50) instead of four significant digits. Findings 39 and 40 in the main repository.
- **v2.0.1** (Angular 22): standalone components, bootstrapped without NgModules, and no
  `@angular/animations`; the initial bundle shrinks from 972 kB to 869 kB. The spinner is
  named "Loading" for screen readers. The build lints with angular-eslint, and the e2e tests
  fail on serious axe-core findings. The look and behaviour are v2.0.0's.
- **v2.0.0** (Angular 22, Node.js 24): the fonts and icons come from the SPA, under `media/`,
  not from Google Fonts; the look is otherwise v1.4.0's. The build runs on Node.js 24 with
  the esbuild-based application builder, the unit tests on Vitest, and the e2e tests with
  `ng e2e` from the root project. HttpClient goes through `provideHttpClient`, still with XHR,
  and still sends the raw XSRF-TOKEN cookie as X-XSRF-TOKEN.
- **v1.4.0** (Angular 16): Angular Material's MDC components replace the legacy ones, which
  changes the look ([`plan/screens/mdc`](plan/screens/mdc) against `v13`): filled form fields
  with floating labels, Material's MDC typography with wider letter spacing, and new spacing in
  cards, buttons and the order dialog. Behaviour, roles and labels are unchanged.
- **v1.3.0** (Angular 13): the page is titled "Polar Bookshop"; the look is unchanged
  ([`plan/screens/v13`](plan/screens/v13)). The build has the node-gradle plugin 7.1.0, and
  the e2e tests pin the CSRF token and headers the SPA sends.
- **v1.2.1** and earlier: see git history.

## Instructions

Lint the code and the templates with angular-eslint.

```shell
./gradlew lintAngular
```

Run the unit tests once, with Vitest in jsdom, so they need no browser. The JUnit results go to
`build/test-results/testAngular`.

```shell
./gradlew testAngular
```

Run the following command to build the project.

```shell
./gradlew buildAngular
```

Run the e2e tests against the built SPA, which Playwright serves from `dist/public`. They are
part of the root project and run with `ng e2e`, on Node.js 24 (`.nvmrc`, the version the build
downloads too). `e2e/playwright.config.ts` lists the settings, such as `UI_BASE_URL` to test a
running container instead, or `UI_TEST_CHANNEL=chrome` to use an installed Google Chrome, as CI
does, and skip `npx playwright install`.

```shell
npm ci && npx playwright install chromium-headless-shell
npx ng e2e
```

Then, package it in an NGINX container using the [pack](https://buildpacks.io/docs/tools/pack/)
CLI and the Paketo Buildpacks. Use the builder version in `.github/workflows/commit-stage.yml`.

```shell
pack build polar-ui \
  --builder paketobuildpacks/builder-jammy-base:0.4.673 \
  --buildpack paketo-buildpacks/nginx \
  --path dist
```

`pack` uses Docker by default. To use Podman instead, start Podman's Docker-compatible API
socket and point `pack` at it:

```shell
systemctl --user start podman.socket
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock
pack build polar-ui \
  --builder paketobuildpacks/builder-jammy-base:0.4.673 \
  --buildpack paketo-buildpacks/nginx \
  --path dist \
  --docker-host=inherit
```

Finally, you can run the container as follows. The image has no default port, so `PORT` is
required.

```shell
docker run -d --name polar-ui --publish 9004:9004 --env PORT=9004 polar-ui
podman run -d --name polar-ui --publish 9004:9004 --env PORT=9004 polar-ui
```

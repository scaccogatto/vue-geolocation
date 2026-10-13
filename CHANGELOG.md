# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking (tooling only):** `engines.node` is now `^22.22.2 || >=24.15.0` (was `>=20`). Node 20 is end of life, and CI now runs the test suite on Node 22 and Node 24. The library code itself is unchanged and still runs in any browser.
- `useGeolocation()`: a `PERMISSION_DENIED` error from the watch now clears the watch and resets `isWatching` to `false`, so a later `watchLocation()` starts a fresh watch (and a fresh permission prompt) instead of returning the dead `watchID`. Transient errors (`POSITION_UNAVAILABLE`, `TIMEOUT`) keep the watch running as before.
- Dropped the stale `vite` npm keyword.
- The package no longer ships `dist/index.d.ts.map`: it pointed to `src/index.ts`, which is not published.
- Release workflow: publishes only from `v*` tags whose name matches the `package.json` version, runs lint, typecheck, tests, build and package checks before publishing, and uses the npm bundled with Node 24 instead of an unpinned `npm@latest`. Manual `workflow_dispatch` releases are gone.

### Fixed

- `watchLocation()` no longer leaks the native watch when the first callback is an error: the watch is cleared before the promise rejects (the caller never received the `watchID`, so it could not stop it, and `onUpdate` kept firing).
- CommonJS consumers type-checking with `moduleResolution: node16`/`nodenext` now get CommonJS declarations (`dist/index.d.cts`) through a nested `require` condition, instead of the ESM `index.d.ts` that failed with TS1479. The package is now checked with publint and Are the Types Wrong in CI.
- Demo: the watch status, the error message and the distance are announced to screen readers, and the coordinates table has a caption and row headers.

## [3.1.0] - 2026-07-17

### Added

- `distanceBetween(a, b)`: pure haversine great-circle distance helper (meters), accepting either this package's `Coordinates` or a raw `{ latitude, longitude }` pair. No Vue dependency. Closes [#21](https://github.com/scaccogatto/vue-geolocation/issues/21).

### Changed

- CI now targets Node 24 only, dropping the Node 20 / 22 / 24 matrix (latest LTS, owner decision).
- Release workflow publishes with `npm publish --provenance` and adds a guard step that skips publishing when `name@version` is already on npm.

## [3.0.1] - 2026-06-28

### Changed

- npm metadata only (keywords and description). No code changes.

## [3.0.0] - 2026-06-28

Full TypeScript rewrite targeting **Vue 3**. This is a major, breaking release. The rewrite was first versioned 2.0.0 in the repository, but 2.0.0 was never published: 3.0.0 is the first release after 1.8.0.

### Added

- Reactive `useGeolocation()` composable returning `{ coords, error, isWatching, getLocation, watchLocation, clearWatch }`. The active watch is cleared automatically on scope dispose.
- Standalone, tree-shakeable functions: `getLocation`, `watchLocation`, `clearWatch`, `isSupported`.
- Typed errors: `GeolocationUnsupportedError`, `GeolocationForcedRejectError`.
- Shipped TypeScript declarations (`.d.ts`).
- ESM and CJS builds with `exports` / `main` / `module` / `types` fields.
- Vitest test suite (navigator.geolocation mocked) and GitHub Actions CI.

### Changed

- **Breaking:** Vue 3 only.
- **Breaking:** no plugin and no global properties (`Vue.use(VueGeolocation)`, `$getLocation`, `$watchLocation`, `$clearLocationWatch`). Use `useGeolocation()` or the standalone functions.
- **Breaking:** rejections now pass the full `GeolocationPositionError` (with `.code`) instead of just `error.message`. Fixes [#17](https://github.com/scaccogatto/vue-geolocation/issues/17).
- `watchLocation(options, onUpdate)` resolves with `{ watchID, coordinates }` and accepts an `onUpdate` callback invoked on every fix, so continuous tracking no longer stops after the first value. Fixes [#15](https://github.com/scaccogatto/vue-geolocation/issues/15).

### Removed

- UMD build.
- Webpack 2, Babel 6, UglifyJS and Mocha tooling, replaced by Vite (library mode), `vite-plugin-dts`, Vitest and ESLint flat config.
- The Vue 2 `window.Vue.use` in-browser auto-install (not applicable to Vue 3).

### Fixed

- [#15](https://github.com/scaccogatto/vue-geolocation/issues/15): watch now streams every position update.
- [#17](https://github.com/scaccogatto/vue-geolocation/issues/17): error object is preserved end to end.

## [1.8.0] - 2019-05-13

Last Vue 2 release. See git history.

[Unreleased]: https://github.com/scaccogatto/vue-geolocation/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/scaccogatto/vue-geolocation/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/scaccogatto/vue-geolocation/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/scaccogatto/vue-geolocation/compare/v1.8.0...v3.0.0
[1.8.0]: https://github.com/scaccogatto/vue-geolocation/releases/tag/v1.8.0

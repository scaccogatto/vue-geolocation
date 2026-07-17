# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] — 2026-07-17

### Added

- `distanceBetween(a, b)`: pure haversine great-circle distance helper (meters), accepting either this package's `Coordinates` or a raw `{ latitude, longitude }` pair. No Vue dependency. Closes [#21](https://github.com/scaccogatto/vue-geolocation/issues/21).

### Changed

- CI now targets Node 24 only, dropping the Node 20 / 22 / 24 matrix (latest LTS, owner decision).
- Release workflow publishes with `npm publish --provenance` and adds a guard step that skips publishing when `name@version` is already on npm.

## [2.0.0] - 2026-06-28

Full TypeScript rewrite targeting **Vue 3**. This is a major, breaking release.

### Added

- Reactive `useGeolocation()` composable returning `{ coords, error, isWatching, getLocation, watchLocation, clearWatch }`; the active watch is cleared automatically on scope dispose.
- Standalone, tree-shakeable functions: `getLocation`, `watchLocation`, `clearWatch`, `isSupported`.
- Typed errors: `GeolocationUnsupportedError`, `GeolocationForcedRejectError`.
- Shipped TypeScript declarations (`.d.ts`) including `ComponentCustomProperties` augmentation for `$getLocation` / `$watchLocation` / `$clearLocationWatch`.
- ESM, CJS and UMD builds with correct `exports` / `main` / `module` / `types` / `unpkg` fields.
- Real Vitest test suite (25 tests, navigator.geolocation mocked) and a GitHub Actions CI matrix (Node 20 & 22).

### Changed

- **Breaking:** Vue 3 only. Install with `createApp(App).use(VueGeolocation)` instead of `Vue.use(...)`.
- **Breaking:** rejections now pass the full `GeolocationPositionError` (with `.code`) instead of just `error.message`. Fixes [#17](https://github.com/scaccogatto/vue-geolocation/issues/17).
- **Breaking:** `$clearLocationWatch(id)` now returns `void` (and throws when geolocation is unavailable) instead of returning a Promise.
- `$watchLocation(options, onUpdate)` resolves with `{ watchID, coordinates }` and accepts an `onUpdate` callback invoked on every fix, so continuous tracking no longer stops after the first value. Fixes [#15](https://github.com/scaccogatto/vue-geolocation/issues/15).

### Removed

- Webpack 2, Babel 6, UglifyJS and Mocha tooling, replaced by Vite (library mode) + `vite-plugin-dts` + Vitest + ESLint flat config.
- The Vue 2 `window.Vue.use` in-browser auto-install (not applicable to Vue 3).

### Fixed

- [#15](https://github.com/scaccogatto/vue-geolocation/issues/15) — watch now streams every position update.
- [#17](https://github.com/scaccogatto/vue-geolocation/issues/17) — error object is preserved end to end.

## [1.8.0] - 2019-05

Last Vue 2 release. See git history.

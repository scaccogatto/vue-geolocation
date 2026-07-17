# vue-browser-geolocation

> Tiny, type-safe Geolocation for Vue 3 — a reactive `useGeolocation()` composable and standalone Promise-based helpers.

[![npm version](https://img.shields.io/npm/v/vue-browser-geolocation.svg)](https://www.npmjs.com/package/vue-browser-geolocation)
[![npm downloads](https://img.shields.io/npm/dm/vue-browser-geolocation)](https://www.npmjs.com/package/vue-browser-geolocation)
[![CI](https://github.com/scaccogatto/vue-geolocation/actions/workflows/ci.yml/badge.svg)](https://github.com/scaccogatto/vue-geolocation/actions/workflows/ci.yml)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/vue-browser-geolocation)](https://bundlephobia.com/package/vue-browser-geolocation)
[![license](https://img.shields.io/npm/l/vue-browser-geolocation.svg)](./LICENSE)

- **Reactive composable** — `useGeolocation()` for `<script setup>`; auto-clears watches on unmount.
- **Reactive streaming** — `coords` updates on _every_ position fix, not just the first.
- **Real errors** — rejects with the full [`GeolocationPositionError`](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError) so you can branch on `error.code`.
- **Type-safe** — written in TypeScript, ships `.d.ts`. ESM + CJS builds.
- **Lightweight** — zero runtime dependencies, `vue` is a peer dependency.

## Install

```sh
npm install vue-browser-geolocation
# or
pnpm add vue-browser-geolocation
# or
yarn add vue-browser-geolocation
```

Requires **Vue 3** (`^3.2.25`).

## Composable (recommended)

```vue
<script setup lang="ts">
import { useGeolocation } from 'vue-browser-geolocation'

const { coords, error, isWatching, getLocation, watchLocation, clearWatch } =
  useGeolocation({ enableHighAccuracy: true })

// one-shot
async function locate() {
  await getLocation()
  console.log(coords.value) // { lat, lng, accuracy, ... }
}

// continuous — coords.value updates on every fix
watchLocation()
</script>

<template>
  <p v-if="error">Error {{ error.code ?? '' }}: {{ error.message }}</p>
  <p v-else-if="coords">{{ coords.lat }}, {{ coords.lng }}</p>
  <button @click="locate">Locate me</button>
  <button v-if="isWatching" @click="clearWatch">Stop watching</button>
</template>
```

`useGeolocation()` returns reactive refs and automatically clears the active watch when the component unmounts.

| Field | Type | Description |
| --- | --- | --- |
| `coords` | `Ref<Coordinates \| null>` | Latest fix, `null` before the first one. |
| `error` | `Ref<GeolocationError \| null>` | Latest error (full object), `null` when fine. |
| `isWatching` | `Ref<boolean>` | Whether a watch is active. |
| `getLocation(options?)` | `Promise<Coordinates>` | One-shot fetch; updates `coords`/`error`. |
| `watchLocation(options?)` | `number \| undefined` | Starts a watch, returns its `watchID`. |
| `clearWatch()` | `void` | Stops the active watch. |

## Why not VueUse's `useGeolocation`?

- Flat, typed `Coordinates` result (`{ lat, lng, accuracy, ... }`) instead of raw `GeolocationCoordinates`/`GeolocationPosition` fields spread across refs.
- Typed error classes — `GeolocationUnsupportedError` and `GeolocationForcedRejectError` — so you can `instanceof`-check failure modes instead of parsing messages.
- Built-in `forceReject` testing hook on `getLocation`/`watchLocation` to exercise failure paths without mocking `navigator.geolocation`.
- Zero dependencies beyond the `vue` peer dependency — no `@vueuse/core` / `@vueuse/shared` pulled in.

## Standalone functions

Everything is also importable directly, no Vue instance required:

```ts
import {
  getLocation,
  watchLocation,
  clearWatch,
  isSupported,
} from 'vue-browser-geolocation'
```

## `Coordinates`

```ts
interface Coordinates {
  lat: number
  lng: number
  altitude: number | null
  altitudeAccuracy: number | null
  accuracy: number
  heading: number | null
  speed: number | null
}
```

## Options

See [`PositionOptions`](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions) — `{ enableHighAccuracy?, timeout?, maximumAge? }`.

## Testing escape hatch

`getLocation` and `watchLocation` accept a trailing `forceReject` flag. When `true`, the promise rejects immediately with a `GeolocationForcedRejectError`, letting you exercise failure paths without touching the real device API:

```ts
await getLocation({}, true) // rejects
await watchLocation({}, undefined, true) // rejects
```

## Migrating from v2 (plugin API)

v3 drops the `VueGeolocation` plugin and the `$getLocation / $watchLocation / $clearLocationWatch` global properties — use `useGeolocation()` or the standalone functions directly.

## Migrating from v1 (Vue 2)

v2/v3 target **Vue 3 only**. Breaking changes from v1:

| v1 (Vue 2) | v3 (Vue 3) |
| --- | --- |
| `Vue.use(VueGeolocation)` | use `useGeolocation()` composable |
| `reject(error.message)` (string) | `reject(error)` — full `GeolocationPositionError`; read `error.code` |
| `$watchLocation()` resolved once | `watchLocation(options, onUpdate)` resolves with `{ watchID, coordinates }` and streams via `onUpdate` ([#15](https://github.com/scaccogatto/vue-geolocation/issues/15)) |
| no composable | reactive `useGeolocation()` |
| plain JS, no types | TypeScript, ships `.d.ts` |

If you cannot migrate to Vue 3 yet, stay on `vue-browser-geolocation@1.8.0`.

## License

[MIT](./LICENSE) © Marco Boffo

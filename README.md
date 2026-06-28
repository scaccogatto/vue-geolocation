# vue-browser-geolocation

> Tiny, type-safe Geolocation for Vue 3 — a Promise-based plugin **and** a reactive `useGeolocation()` composable.

[![npm version](https://img.shields.io/npm/v/vue-browser-geolocation.svg)](https://www.npmjs.com/package/vue-browser-geolocation)
[![CI](https://github.com/scaccogatto/vue-geolocation/actions/workflows/ci.yml/badge.svg)](https://github.com/scaccogatto/vue-geolocation/actions/workflows/ci.yml)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/vue-browser-geolocation)](https://bundlephobia.com/package/vue-browser-geolocation)
[![license](https://img.shields.io/npm/l/vue-browser-geolocation.svg)](./LICENSE)

- **Two ergonomic APIs** — a global plugin (`$getLocation` / `$watchLocation` / `$clearLocationWatch`) for the Options API, and a fully reactive `useGeolocation()` composable for `<script setup>`.
- **Reactive streaming** — `coords` updates on _every_ position fix, not just the first.
- **Real errors** — rejects with the full [`GeolocationPositionError`](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError) so you can branch on `error.code`.
- **Type-safe** — written in TypeScript, ships `.d.ts` and augments `ComponentCustomProperties`.
- **Lightweight** — zero runtime dependencies, `vue` is a peer dependency. ESM + CJS + UMD builds.

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

## Plugin (Options API)

```ts
import { createApp } from 'vue'
import VueGeolocation from 'vue-browser-geolocation'
import App from './App.vue'

createApp(App).use(VueGeolocation).mount('#app')
```

```ts
// one-shot
const coords = await this.$getLocation(options)

// watch — pass an onUpdate callback to receive every fix
const { watchID } = await this.$watchLocation(options, (coords) => {
  console.log(coords)
})

// stop
this.$clearLocationWatch(watchID)
```

> A bare `await this.$watchLocation()` resolves only once (a Promise can't yield more than one value). Pass the `onUpdate` callback for continuous updates, or use `useGeolocation()`.

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

## Migrating from v1 (Vue 2)

v2 is a TypeScript rewrite that targets **Vue 3 only**. Breaking changes:

| v1 (Vue 2) | v2 (Vue 3) |
| --- | --- |
| `Vue.use(VueGeolocation)` | `createApp(App).use(VueGeolocation)` |
| `reject(error.message)` (string) | `reject(error)` — full `GeolocationPositionError`; read `error.code` |
| `$watchLocation()` resolved once, no watchID | `$watchLocation(options, onUpdate)` resolves with `{ watchID, coordinates }` and streams via `onUpdate` ([#15](https://github.com/scaccogatto/vue-geolocation/issues/15)) |
| `$clearLocationWatch(id)` returned a Promise | now returns `void` (throws if unsupported) |
| no composable | new reactive `useGeolocation()` |
| plain JS, no types | TypeScript, ships `.d.ts` |

If you cannot migrate to Vue 3 yet, stay on `vue-browser-geolocation@1.8.0`.

## License

[MIT](./LICENSE) © Marco Boffo

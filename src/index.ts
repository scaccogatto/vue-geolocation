import {
  getCurrentScope,
  onScopeDispose,
  ref,
  type App,
  type Ref,
} from 'vue'

/**
 * Normalised coordinates returned by every API in this library.
 * A flat, JSON-friendly shape derived from {@link GeolocationCoordinates}.
 */
export interface Coordinates {
  lat: number
  lng: number
  altitude: number | null
  altitudeAccuracy: number | null
  accuracy: number
  heading: number | null
  speed: number | null
}

/** Error raised when the Geolocation API is not available in the environment. */
export class GeolocationUnsupportedError extends Error {
  constructor() {
    super('Geolocation is not supported in this environment')
    this.name = 'GeolocationUnsupportedError'
  }
}

/** Error used by the `forceReject` testing escape hatch. */
export class GeolocationForcedRejectError extends Error {
  constructor() {
    super('reject forced for testing purposes')
    this.name = 'GeolocationForcedRejectError'
  }
}

/** Any error a geolocation call may surface to the caller. */
export type GeolocationError =
  | GeolocationPositionError
  | GeolocationUnsupportedError
  | GeolocationForcedRejectError

/** Result of a successful {@link watchLocation} call. */
export interface WatchResult {
  /** Identifier to pass to {@link clearWatch} to stop the watch. */
  watchID: number
  /** Coordinates from the first position fix. */
  coordinates: Coordinates
}

/** Callback invoked on every position update from a watch. */
export type WatchCallback = (coordinates: Coordinates) => void

const toCoordinates = (position: GeolocationPosition): Coordinates => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  altitude: position.coords.altitude,
  altitudeAccuracy: position.coords.altitudeAccuracy,
  accuracy: position.coords.accuracy,
  heading: position.coords.heading,
  speed: position.coords.speed,
})

/** Whether the Geolocation API is available in the current environment. */
export const isSupported = (): boolean =>
  typeof navigator !== 'undefined' && navigator.geolocation != null

/**
 * One-shot location request wrapped in a Promise.
 *
 * @param options - Standard {@link PositionOptions}.
 * @param forceReject - When `true`, rejects immediately (testing escape hatch).
 * @returns The resolved {@link Coordinates}.
 * @remarks On failure the promise rejects with the full
 * {@link GeolocationPositionError} (so callers can branch on `error.code`),
 * not just its message. (Fixes #17.)
 */
export const getLocation = (
  options: PositionOptions = {},
  forceReject = false,
): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (forceReject) {
      reject(new GeolocationForcedRejectError())
      return
    }
    if (!isSupported()) {
      reject(new GeolocationUnsupportedError())
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toCoordinates(position)),
      (error) => reject(error),
      options,
    )
  })

/**
 * Start watching the device location.
 *
 * The returned promise resolves once, on the first fix, with the
 * {@link WatchResult} (including the `watchID` needed to stop the watch).
 * To receive *every* subsequent update, pass an `onUpdate` callback — the
 * promise alone cannot deliver more than one value. (Fixes #15.)
 *
 * For a fully reactive experience prefer {@link useGeolocation}.
 *
 * @param options - Standard {@link PositionOptions}.
 * @param onUpdate - Invoked with fresh coordinates on every position fix.
 * @param forceReject - When `true`, rejects immediately (testing escape hatch).
 */
export const watchLocation = (
  options: PositionOptions = {},
  onUpdate?: WatchCallback,
  forceReject = false,
): Promise<WatchResult> =>
  new Promise((resolve, reject) => {
    if (forceReject) {
      reject(new GeolocationForcedRejectError())
      return
    }
    if (!isSupported()) {
      reject(new GeolocationUnsupportedError())
      return
    }
    let settled = false
    const watchID = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates = toCoordinates(position)
        onUpdate?.(coordinates)
        if (!settled) {
          settled = true
          resolve({ watchID, coordinates })
        }
      },
      (error) => {
        if (!settled) {
          settled = true
          reject(error)
        }
      },
      options,
    )
  })

/**
 * Stop a watch started by {@link watchLocation}.
 * @throws {GeolocationUnsupportedError} When the Geolocation API is unavailable.
 */
export const clearWatch = (watchID: number): void => {
  if (!isSupported()) throw new GeolocationUnsupportedError()
  navigator.geolocation.clearWatch(watchID)
}

/** Reactive state and actions returned by {@link useGeolocation}. */
export interface UseGeolocationReturn {
  /** Latest coordinates, or `null` before the first fix. */
  coords: Ref<Coordinates | null>
  /** Latest error, or `null` while everything is fine. */
  error: Ref<GeolocationError | null>
  /** Whether a watch is currently active. */
  isWatching: Ref<boolean>
  /** One-shot fetch; updates `coords`/`error` and resolves with the value. */
  getLocation: (options?: PositionOptions) => Promise<Coordinates>
  /** Start watching; updates `coords` on every fix. Returns the `watchID`. */
  watchLocation: (options?: PositionOptions) => number | undefined
  /** Stop the active watch (also runs automatically on scope dispose). */
  clearWatch: () => void
}

/**
 * Reactive Geolocation composable.
 *
 * Unlike the Promise-based {@link watchLocation}, the `coords` ref here updates
 * on *every* position callback, so `watchLocation()` keeps streaming fixes.
 * (Fixes #15.) Errors are exposed as the full error object. (Fixes #17.)
 *
 * The active watch is cleared automatically when the owning effect scope is
 * disposed (e.g. the component unmounts).
 *
 * @param defaultOptions - {@link PositionOptions} used when a method is called
 * without its own options.
 */
export const useGeolocation = (
  defaultOptions: PositionOptions = {},
): UseGeolocationReturn => {
  const coords = ref<Coordinates | null>(null)
  const error = ref<GeolocationError | null>(null)
  const isWatching = ref(false)
  let watchID: number | null = null

  const get = async (options: PositionOptions = defaultOptions) => {
    try {
      const value = await getLocation(options)
      coords.value = value
      error.value = null
      return value
    } catch (caught) {
      error.value = caught as GeolocationError
      throw caught
    }
  }

  const clear = () => {
    if (watchID !== null) {
      navigator.geolocation.clearWatch(watchID)
      watchID = null
    }
    isWatching.value = false
  }

  const watch = (options: PositionOptions = defaultOptions) => {
    if (!isSupported()) {
      error.value = new GeolocationUnsupportedError()
      return undefined
    }
    if (watchID !== null) return watchID
    isWatching.value = true
    watchID = navigator.geolocation.watchPosition(
      (position) => {
        coords.value = toCoordinates(position)
        error.value = null
      },
      (caught) => {
        error.value = caught
      },
      options,
    )
    return watchID
  }

  if (getCurrentScope()) onScopeDispose(clear)

  return {
    coords,
    error,
    isWatching,
    getLocation: get,
    watchLocation: watch,
    clearWatch: clear,
  }
}

/**
 * Vue 3 plugin. Registers the Promise-based helpers as global properties:
 * `$getLocation`, `$watchLocation`, `$clearLocationWatch`.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import VueGeolocation from 'vue-browser-geolocation'
 * createApp(App).use(VueGeolocation).mount('#app')
 * ```
 */
export const VueGeolocation = {
  install(app: App): void {
    app.config.globalProperties.$getLocation = getLocation
    app.config.globalProperties.$watchLocation = watchLocation
    app.config.globalProperties.$clearLocationWatch = clearWatch
  },
}

export default VueGeolocation

declare module 'vue' {
  interface ComponentCustomProperties {
    $getLocation: typeof getLocation
    $watchLocation: typeof watchLocation
    $clearLocationWatch: typeof clearWatch
  }
}

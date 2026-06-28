import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearWatch,
  getLocation,
  GeolocationForcedRejectError,
  GeolocationUnsupportedError,
  isSupported,
  useGeolocation,
  watchLocation,
  type Coordinates,
} from '../src/index'
import {
  installGeolocationMock,
  makeError,
  makePosition,
  removeGeolocation,
  type GeolocationHarness,
} from './geolocation-mock'

let harness: GeolocationHarness

beforeEach(() => {
  harness = installGeolocationMock()
})

afterEach(() => {
  harness.restore()
  vi.restoreAllMocks()
})

describe('isSupported', () => {
  it('reports true when navigator.geolocation exists', () => {
    expect(isSupported()).toBe(true)
  })

  it('reports false when navigator.geolocation is missing', () => {
    const restore = removeGeolocation()
    expect(isSupported()).toBe(false)
    restore()
  })
})

describe('getLocation', () => {
  it('resolves with normalised coordinates on success', async () => {
    harness.setCurrentPosition({
      type: 'success',
      position: makePosition({ latitude: 12.5, longitude: -3.25, accuracy: 5 }),
    })
    const coords = await getLocation()
    expect(coords).toEqual<Coordinates>({
      lat: 12.5,
      lng: -3.25,
      altitude: null,
      altitudeAccuracy: null,
      accuracy: 5,
      heading: null,
      speed: null,
    })
  })

  it('forwards PositionOptions to the browser API', async () => {
    harness.setCurrentPosition({ type: 'success', position: makePosition() })
    const options: PositionOptions = { enableHighAccuracy: true, timeout: 5000 }
    await getLocation(options)
    expect(harness.geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      options,
    )
  })

  it('rejects with the full GeolocationPositionError, preserving code (#17)', async () => {
    harness.setCurrentPosition({
      type: 'error',
      error: makeError(1, 'User denied Geolocation'),
    })
    await expect(getLocation()).rejects.toMatchObject({
      code: 1,
      message: 'User denied Geolocation',
    })
  })

  it.each([1, 2, 3] as const)(
    'propagates error code %i unchanged (#17)',
    async (code) => {
      harness.setCurrentPosition({ type: 'error', error: makeError(code) })
      await expect(getLocation()).rejects.toMatchObject({ code })
    },
  )

  it('rejects with a forced-reject error when forceReject is true', async () => {
    await expect(getLocation({}, true)).rejects.toBeInstanceOf(
      GeolocationForcedRejectError,
    )
    expect(harness.geolocation.getCurrentPosition).not.toHaveBeenCalled()
  })

  it('rejects with GeolocationUnsupportedError when unavailable', async () => {
    const restore = removeGeolocation()
    await expect(getLocation()).rejects.toBeInstanceOf(
      GeolocationUnsupportedError,
    )
    restore()
  })
})

describe('watchLocation (promise + onUpdate)', () => {
  it('resolves once with the watchID and first fix', async () => {
    const promise = watchLocation()
    await Promise.resolve()
    harness.emitWatch(makePosition({ latitude: 1, longitude: 2 }))
    const result = await promise
    expect(result.watchID).toBe(1)
    expect(result.coordinates.lat).toBe(1)
    expect(result.coordinates.lng).toBe(2)
  })

  it('invokes onUpdate on every position fix, not just the first (#15)', async () => {
    const updates: Coordinates[] = []
    const promise = watchLocation({}, (c) => updates.push(c))
    await Promise.resolve()
    harness.emitWatch(makePosition({ latitude: 1 }))
    await promise
    harness.emitWatch(makePosition({ latitude: 2 }))
    harness.emitWatch(makePosition({ latitude: 3 }))
    expect(updates.map((c) => c.lat)).toEqual([1, 2, 3])
  })

  it('rejects with the full error before the first fix (#17)', async () => {
    const promise = watchLocation()
    harness.emitWatchError(makeError(2, 'unavailable'))
    await expect(promise).rejects.toMatchObject({ code: 2 })
  })

  it('rejects with a forced-reject error when forceReject is true', async () => {
    await expect(watchLocation({}, undefined, true)).rejects.toBeInstanceOf(
      GeolocationForcedRejectError,
    )
  })
})

describe('clearWatch', () => {
  it('delegates to navigator.geolocation.clearWatch', () => {
    clearWatch(42)
    expect(harness.geolocation.clearWatch).toHaveBeenCalledWith(42)
  })

  it('throws GeolocationUnsupportedError when unavailable', () => {
    const restore = removeGeolocation()
    expect(() => clearWatch(1)).toThrow(GeolocationUnsupportedError)
    restore()
  })
})

describe('useGeolocation', () => {
  it('getLocation updates coords and clears error', async () => {
    const scope = effectScope()
    await scope.run(async () => {
      const { coords, error, getLocation: get } = useGeolocation()
      harness.setCurrentPosition({
        type: 'success',
        position: makePosition({ latitude: 7 }),
      })
      await get()
      expect(coords.value?.lat).toBe(7)
      expect(error.value).toBeNull()
    })
    scope.stop()
  })

  it('getLocation records the full error and rethrows (#17)', async () => {
    const scope = effectScope()
    await scope.run(async () => {
      const { coords, error, getLocation: get } = useGeolocation()
      harness.setCurrentPosition({ type: 'error', error: makeError(1) })
      await expect(get()).rejects.toMatchObject({ code: 1 })
      expect(error.value).toMatchObject({ code: 1 })
      expect(coords.value).toBeNull()
    })
    scope.stop()
  })

  it('watchLocation streams coords on every fix and toggles isWatching (#15)', async () => {
    const scope = effectScope()
    scope.run(() => {
      const { coords, isWatching, watchLocation: watch } = useGeolocation()
      expect(isWatching.value).toBe(false)
      const id = watch()
      expect(id).toBe(1)
      expect(isWatching.value).toBe(true)

      harness.emitWatch(makePosition({ latitude: 10 }))
      expect(coords.value?.lat).toBe(10)
      harness.emitWatch(makePosition({ latitude: 20 }))
      expect(coords.value?.lat).toBe(20)
      harness.emitWatch(makePosition({ latitude: 30 }))
      expect(coords.value?.lat).toBe(30)
    })
    scope.stop()
  })

  it('watchLocation is idempotent — a second call reuses the same watch', () => {
    const scope = effectScope()
    scope.run(() => {
      const { watchLocation: watch } = useGeolocation()
      const first = watch()
      const second = watch()
      expect(first).toBe(second)
      expect(harness.geolocation.watchPosition).toHaveBeenCalledTimes(1)
    })
    scope.stop()
  })

  it('records errors from the watch callback (#17)', () => {
    const scope = effectScope()
    scope.run(() => {
      const { error, watchLocation: watch } = useGeolocation()
      watch()
      harness.emitWatchError(makeError(3, 'timeout'))
      expect(error.value).toMatchObject({ code: 3, message: 'timeout' })
    })
    scope.stop()
  })

  it('clearWatch stops the watch and resets isWatching', () => {
    const scope = effectScope()
    scope.run(() => {
      const { isWatching, watchLocation: watch, clearWatch: clear } =
        useGeolocation()
      const id = watch()
      clear()
      expect(harness.geolocation.clearWatch).toHaveBeenCalledWith(id)
      expect(isWatching.value).toBe(false)
    })
    scope.stop()
  })

  it('auto-clears the watch when the effect scope is disposed', () => {
    const scope = effectScope()
    let id: number | undefined
    scope.run(() => {
      const { watchLocation: watch } = useGeolocation()
      id = watch()
    })
    scope.stop()
    expect(harness.geolocation.clearWatch).toHaveBeenCalledWith(id)
  })

  it('sets an unsupported error and does not start a watch when unavailable', () => {
    const restore = removeGeolocation()
    const scope = effectScope()
    scope.run(() => {
      const { error, isWatching, watchLocation: watch } = useGeolocation()
      expect(watch()).toBeUndefined()
      expect(error.value).toBeInstanceOf(GeolocationUnsupportedError)
      expect(isWatching.value).toBe(false)
    })
    scope.stop()
    restore()
  })
})

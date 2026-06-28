import { vi } from 'vitest'

export interface PositionFixture {
  latitude?: number
  longitude?: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  accuracy?: number
  heading?: number | null
  speed?: number | null
}

export const makePosition = (
  fixture: PositionFixture = {},
): GeolocationPosition => ({
  timestamp: Date.now(),
  coords: {
    latitude: fixture.latitude ?? 45.0,
    longitude: fixture.longitude ?? 9.0,
    altitude: fixture.altitude ?? null,
    altitudeAccuracy: fixture.altitudeAccuracy ?? null,
    accuracy: fixture.accuracy ?? 10,
    heading: fixture.heading ?? null,
    speed: fixture.speed ?? null,
    toJSON() {
      return this
    },
  } as GeolocationCoordinates,
  toJSON() {
    return this
  },
})

export const makeError = (
  code: GeolocationPositionError['code'],
  message = 'mock error',
): GeolocationPositionError =>
  ({
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }) as GeolocationPositionError

type SuccessCb = PositionCallback
type ErrorCb = PositionErrorCallback

export interface GeolocationHarness {
  geolocation: Geolocation
  /** Drive the next/all stored watch success callbacks with a position. */
  emitWatch: (position: GeolocationPosition, watchID?: number) => void
  /** Drive stored watch error callbacks. */
  emitWatchError: (error: GeolocationPositionError, watchID?: number) => void
  /** Configure the one-shot getCurrentPosition outcome. */
  setCurrentPosition: (
    outcome:
      | { type: 'success'; position: GeolocationPosition }
      | { type: 'error'; error: GeolocationPositionError },
  ) => void
  restore: () => void
}

/**
 * Install a controllable navigator.geolocation mock.
 * Callbacks fire asynchronously (queueMicrotask) to mirror the real browser
 * and to guarantee watchPosition has returned its id before callbacks run.
 */
export const installGeolocationMock = (): GeolocationHarness => {
  const watchers = new Map<number, { success: SuccessCb; error: ErrorCb }>()
  let nextId = 1
  let currentOutcome:
    | { type: 'success'; position: GeolocationPosition }
    | { type: 'error'; error: GeolocationPositionError }
    | null = null

  const geolocation: Geolocation = {
    getCurrentPosition: vi.fn(
      (success: SuccessCb, error?: ErrorCb | null) => {
        queueMicrotask(() => {
          if (currentOutcome?.type === 'success') success(currentOutcome.position)
          else if (currentOutcome?.type === 'error') error?.(currentOutcome.error)
        })
      },
    ),
    watchPosition: vi.fn(
      (success: SuccessCb, error?: ErrorCb | null) => {
        const id = nextId++
        watchers.set(id, { success, error: error ?? (() => {}) })
        return id
      },
    ),
    clearWatch: vi.fn((id: number) => {
      watchers.delete(id)
    }),
  }

  const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation')
  Object.defineProperty(navigator, 'geolocation', {
    value: geolocation,
    configurable: true,
    writable: true,
  })

  return {
    geolocation,
    emitWatch: (position, watchID) => {
      for (const [id, cb] of watchers)
        if (watchID === undefined || id === watchID) cb.success(position)
    },
    emitWatchError: (error, watchID) => {
      for (const [id, cb] of watchers)
        if (watchID === undefined || id === watchID) cb.error(error)
    },
    setCurrentPosition: (outcome) => {
      currentOutcome = outcome
    },
    restore: () => {
      if (original) Object.defineProperty(navigator, 'geolocation', original)
      else
        Object.defineProperty(navigator, 'geolocation', {
          value: undefined,
          configurable: true,
          writable: true,
        })
    },
  }
}

/** Remove navigator.geolocation entirely to test the unsupported path. */
export const removeGeolocation = (): (() => void) => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation')
  Object.defineProperty(navigator, 'geolocation', {
    value: undefined,
    configurable: true,
    writable: true,
  })
  return () => {
    if (original) Object.defineProperty(navigator, 'geolocation', original)
  }
}

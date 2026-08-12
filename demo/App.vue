<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  distanceBetween,
  isSupported,
  useGeolocation,
  type Coordinates,
} from 'vue-browser-geolocation'

const { coords, error, isWatching, getLocation, watchLocation, clearWatch } =
  useGeolocation({ enableHighAccuracy: true })

const supported = isSupported()
const pending = ref(false)
const firstFix = ref<Coordinates | null>(null)

const fetchOnce = async () => {
  pending.value = true
  try {
    const value = await getLocation()
    firstFix.value ??= value
  } catch {
    // The error ref already carries it — nothing to add here.
  } finally {
    pending.value = false
  }
}

const startWatch = () => {
  firstFix.value ??= coords.value
  watchLocation()
}

// Distance travelled since the first fix of this session.
const travelled = computed(() =>
  firstFix.value && coords.value
    ? Math.round(distanceBetween(firstFix.value, coords.value))
    : null,
)

// GeolocationPositionError carries a numeric `code`, the library's own errors
// are Error subclasses with a `name` — the union has no field in common.
const errorLabel = computed(() => {
  const caught = error.value
  if (!caught) return null
  return 'name' in caught
    ? caught.name
    : `GeolocationPositionError (code ${caught.code})`
})

const rows = computed(() =>
  coords.value
    ? (Object.entries(coords.value) as [string, number | null][])
    : [],
)
</script>

<template>
  <main>
    <h1>vue-geolocation</h1>
    <p class="lede">
      A reactive wrapper around the browser Geolocation API. Your browser will
      ask for permission; nothing is sent anywhere, the coordinates stay in this
      page.
    </p>

    <p v-if="!supported" class="error">
      This browser exposes no Geolocation API.
    </p>

    <div class="actions">
      <button type="button" :disabled="!supported || pending" @click="fetchOnce">
        {{ pending ? 'Locating…' : 'getLocation()' }}
      </button>
      <button
        type="button"
        :disabled="!supported || isWatching"
        @click="startWatch"
      >
        watchLocation()
      </button>
      <button type="button" :disabled="!isWatching" @click="clearWatch">
        clearWatch()
      </button>
      <span class="label">{{ isWatching ? 'watching' : 'idle' }}</span>
    </div>

    <p v-if="error" class="error">
      <code>{{ errorLabel }}</code> — {{ error.message }}
    </p>

    <table v-if="rows.length">
      <tbody>
        <tr v-for="[key, value] in rows" :key="key">
          <th>{{ key }}</th>
          <td>{{ value ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="muted">No fix yet.</p>

    <h2>distanceBetween</h2>
    <p>
      Great-circle distance from the first fix of this session:
      <strong v-if="travelled !== null">{{ travelled }} m</strong>
      <span v-else class="muted">waiting for a second fix</span>
    </p>
  </main>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.4rem 0.5rem 0.4rem 0;
  text-align: left;
  border-bottom: 1px solid var(--line);
}

th {
  width: 12rem;
  font-weight: 600;
  color: var(--muted);
}

td {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}

.error {
  color: #b91c1c;
}

@media (prefers-color-scheme: dark) {
  .error {
    color: #fca5a5;
  }
}

.muted {
  color: var(--muted);
}
</style>

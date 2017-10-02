# vue-geolocation

> ask to your users their coordinates, and wrap them into a Promise

## Plugin install
```
import VueGeolocation from 'vue-geolocation';
Vue.install(VueGeolocation);
```

## Usage
Inside a Vue Component
```
this.$getLocation()
  .then(coordinates => {
    console.log(coordinates);
  });
```
Will prompt a [Geolocation Request](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation)

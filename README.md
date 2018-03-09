# vue-geolocation

> ask to your users their coordinates, and wrap them into a Promise

[![Build Status](https://travis-ci.org/scaccogatto/vue-geolocation.svg?branch=master)](https://travis-ci.org/scaccogatto/vue-geolocation)

## Plugin install
```sh
yarn add vue-browser-geolocation
````
or
```sh
npm install vue-browser-geolocation
````

in  your main.js
```
import VueGeolocation from 'vue-browser-geolocation';
Vue.use(VueGeolocation);
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

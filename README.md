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
this.$getLocation(options)
  .then(coordinates => {
    console.log(coordinates);
  });
```
Will prompt a [Geolocation Request](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation)

or to watch a location

```
this.$watchLocation(options)
  .then(coordinates => {
    console.log(coordinates);
  })
```

you can clear the watcher

```
this.$clearLocationWatch(watchID)
```

please refer to the Geolocation docs to reference how to get a watchID


### Options
See [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions)

#### Example
```
this.$getLocation({
	enableHighAccuracy: bool, //defaults to false
	timeout: Infinity, //defaults to Infinity
	maximumAge: int //defaults to 0
	
})
  .then(coordinates => {
    console.log(coordinates);
  });
```

### Forcing failure in automated testing

If you need to setup automated testing in your application, and you need to force failure of geolocation to test how your application behaves, you can pass a second argument (forceReject) to this.$getGelocation and this.$watchLocation:

```
this.$getLocation(positionOptions, forceReject)

this.$watchLocation(positionOptions, forceReject)
```
if the parameter is `true`, the promise will be rejected with a special error message.
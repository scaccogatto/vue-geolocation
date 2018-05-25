const VueGeolocation = {
  install (Vue) {
    // define the main instance function
    Vue.prototype.$getLocation = VueGeolocation.getLocation
    Vue.prototype.$watchLocation = VueGeolocation.watchLocation
    Vue.prototype.$clearLocationWatch = VueGeolocation.clearLocation
  },
  getLocation (options = {}) {
    return new Promise((resolve, reject) => {
      if (!VueGeolocation._isAvailable()) {
        reject('no browser support')
      } else {
        window.navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          () => {
            reject('no position access')
          },
          options
        )
      }
    })
  },
  watchLocation (options = {}) {
    return new Promise((resolve, reject) => {
      if (!VueGeolocation._isAvailable()) {
        reject('no browser support')
      } else {
        window.navigator.geolocation.watchPosition(
          position => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          () => {
            reject('no position access')
          },
          options
        )
      }
    })
  },
  clearLocation (watchID) {
    return new Promise((resolve, reject) => {
      if (!VueGeolocation._isAvailable()) {
        reject('no browser support')
      }
      else if (!watchID) {
        reject('please provide watchID')
      } else {
        resolve(window.navigator.geolocation.clearWatch(watchID))
      }
    })
  },
  _isAvailable () {
    return 'geolocation' in window.navigator
  }
}

export default VueGeolocation

// in-browser load
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueGeolocation)
}

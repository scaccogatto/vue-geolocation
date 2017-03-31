const VueGeolocation = {
  install (Vue) {
    // define the main instance function
    Vue.prototype.$getLocation = VueGeolocation.getLocation
  },
  getLocation () {
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
          }
        )
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

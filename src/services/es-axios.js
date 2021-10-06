const axios = require('axios')
const esAuth = require('../edu-sharing/get-auth-token')
const { authObj } = require('../edu-sharing/get-auth-token')

const esAxios = axios.create()

function initEsAxios() {
  // Interceptor to use newest auth-token
  esAxios.interceptors.request.use(
    (config) => {
      config.headers.Authorization = authObj.type + ' ' + authObj.token_access
      return config
    },
    (error) => {
      Promise.reject(error)
    }
  )

  // Interceptor to handle 401 and retry request with refreshed token
  esAxios.interceptors.response.use(
    (response) => {
      return response
    },
    async function(error) {
      const originalRequest = error.config
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        await esAuth.checkEsAuthExpiration(authObj)
        originalRequest.headers.Authorization = authObj.type + ' ' + authObj.token_access
        return axios(originalRequest)
      } else {
        return Promise.reject(error)
      }
    }
  )
}

module.exports = {
  esAxios,
  initEsAxios
}

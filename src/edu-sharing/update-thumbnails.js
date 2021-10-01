'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default
const pLimit = require('p-limit')
const FormData = require('form-data')

async function updateThumbnails(ocInstance, episodesData, authObj) {
  logger.Info('[ES API] Update episodes thumbnails for ' + ocInstance)

  return await returnReqsAsPromiseArray(authObj, episodesData)
    .then(async (res) => {
      return episodesData
    })
    .catch((error) => {
      return error
    })

  async function returnReqsAsPromiseArray(authObj, episodesData) {
    const limit = pLimit(CONF.es.settings.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (!episodesData[i].nodeId) continue
      if (!episodesData[i].previewPlayer) continue

      const formData = await requestThumbnail(episodesData[i])
      if (!formData) continue

      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlUpdateThumbnail(episodesData[i]),
            formData,
            getHeadersUpdateThumbnail(authObj, formData),
            i
          ).catch((error) => {
            return error
          })
        )
      )
    }

    return Promise.allSettled(requests)
  }

  async function sendPostRequest(url, body, headers, index) {
    return await axios
      .post(url, body, headers)
      .then((response) => {
        if (response.status === 200) {
          return handleResponse(index)
        }
      })
      .catch((error) => {
        return error
      })
  }

  function getUrlUpdateThumbnail(episode) {
    return (
      CONF.es.host.url +
      CONF.es.routes.api +
      CONF.es.routes.baseFolder +
      '/' +
      episode.nodeId +
      '/preview?mimetype=image/jpeg'
    )
  }

  async function requestThumbnail(episode) {
    return await axios
      .get(episode.previewPlayer, { responseType: 'stream' })
      .then(async (response) => {
        if (response.status === 200) {
          const formData = new FormData()
          formData.append('image', response.data)
          return formData
        }
      })
      .catch((error) => {
        return error.response.status
      })
  }

  function getHeadersUpdateThumbnail(authObj, formData) {
    return {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'de-DE,en;q=0.7,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        locale: 'de_DE',
        Authorization: authObj.type + ' ' + authObj.token_access,
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache'
      }
    }
  }

  async function handleResponse(index) {}
}

module.exports = {
  updateThumbnails
}

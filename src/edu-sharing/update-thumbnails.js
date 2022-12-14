'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const { esAxios } = require('../services/es-axios')
const axios = require('axios').default
const pLimit = require('p-limit')
const FormData = require('form-data')
const { ESError, ESPostError } = require('../models/errors')

async function updateThumbnails(ocInstance, episodesData, ocInstanceObj) {
  logger.Info('[ES API] Update episodes thumbnails for ' + ocInstance)

  return await returnReqsAsPromiseArray(episodesData)
    .then(async res => {
      const failedUpdates = res.filter(r => r.status === 'rejected')
      for (let i = 0; i < failedUpdates.length; i++) {
        logger.Warn(failedUpdates[i].reason.toString())
      }
      return episodesData
    })
    .catch(error => {
      if (error instanceof ESError) {
        throw error
      } else throw new ESError('[ES API] Error while updating thumbnails: ' + error.message)
    })

  async function returnReqsAsPromiseArray(episodesData) {
    const limit = pLimit(CONF.es.settings.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (!episodesData[i].nodeId) continue
      if (!getPreviewImageUrl(episodesData[i])) continue

      const formData = await requestThumbnail(episodesData[i])
      if (!formData) continue

      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlUpdateThumbnail(episodesData[i]),
            formData,
            getHeadersUpdateThumbnail(formData),
            i
          ).catch(error => {
            throw new ESError(
              '[ES API] Error while updating thumbnail (' +
                episodesData[i].nodeId +
                '): ' +
                error.message
            )
          })
        )
      )
    }

    return Promise.allSettled(requests)
  }

  async function sendPostRequest(url, body, headers, index) {
    return await esAxios
      .post(url, body, headers)
      .then(response => {
        if (response.status === 200) {
          return true
        }
      })
      .catch(error => {
        throw new ESPostError(error.message, error.code)
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
      .get(getPreviewImageUrl(episode), { responseType: 'stream' })
      .then(async response => {
        if (response && response.status === 200) {
          const formData = new FormData()
          formData.append('image', response.data)
          return formData
        }
      })
      .catch(error => {
        throw new ESError(error.message, error.code)
      })
  }

  function getPreviewImageUrl(episode) {
    const imageUrl = episode.previewPlayer ? episode.previewPlayer : episode.previewSearch
    if (!imageUrl && ocInstanceObj.defaultThumbnailUrl) {
      return ocInstanceObj.defaultThumbnailUrl
    }
    return imageUrl
  }

  function getHeadersUpdateThumbnail(formData) {
    return {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'de-DE,en;q=0.7,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        locale: 'de_DE',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache'
      }
    }
  }
}

module.exports = {
  updateThumbnails
}

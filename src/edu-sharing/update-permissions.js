'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default
const pLimit = require('p-limit')
const { ESError, ESPostError } = require('../models/errors')

async function updatePermissions(ocInstance, episodesData, authObj) {
  logger.Info('[ES API] Update permissions (public) per episode for ' + ocInstance)

  return await returnReqsAsPromiseArray(authObj, episodesData)
    .then(async (res) => {
      return episodesData
    })
    .catch((error) => {
      if (error instanceof ESError) {
        throw error
      } else throw new ESError('[ES API] Error while updating permissions: ' + error.message)
    })

  async function returnReqsAsPromiseArray(authObj, episodesData) {
    const limit = pLimit(CONF.es.settings.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (!episodesData[i].nodeId) continue
      if (episodesData[i].published) continue

      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlUpdatePermissions(episodesData[i]),
            getBodyUpdatePermissions(episodesData[i]),
            getHeadersUpdatePermissions(authObj),
            i
          ).catch((error) => {
            if (error instanceof ESPostError) {
              throw error
            } else throw new ESError('[ES API] Error while updating permissions: ' + error.message)
          })
        )
      )
    }

    return Promise.all(requests)
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
        throw new ESPostError(error.message, error.code)
      })
  }

  function getUrlUpdatePermissions(episode) {
    return (
      CONF.es.host.url +
      CONF.es.routes.api +
      CONF.es.routes.baseFolder +
      '/' +
      episode.nodeId +
      '/permissions'
    )
  }

  function getBodyUpdatePermissions(episode) {
    return JSON.stringify({
      inherited: true,
      permissions: [
        {
          authority: {
            authorityName: 'GROUP_EVERYONE',
            authorityType: 'EVERYONE'
          },
          permissions: ['Consumer']
        }
      ]
    }).toString()
  }

  function getHeadersUpdatePermissions(authObj) {
    return {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'de-DE,en;q=0.7,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        locale: 'de_DE',
        Authorization: authObj.type + ' ' + authObj.token_access,
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache'
      }
    }
  }

  async function handleResponse(index) {
    if (!episodesData[index].published) episodesData[index].published = true
  }
}

module.exports = {
  updatePermissions
}

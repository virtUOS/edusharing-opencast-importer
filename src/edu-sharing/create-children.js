'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default
const pLimit = require('p-limit')

async function createChildren(ocInstance, episodesData, seriesData, authObj) {
  logger.Info('[ES API] Creating children per episode for ' + ocInstance)

  return await returnReqsAsPromiseArray(authObj, episodesData, seriesData)
    .then(async (res) => {
      return episodesData
    })
    .catch((error) => logger.Error(error))

  async function returnReqsAsPromiseArray(authObj, episodesData, seriesData) {
    const limit = pLimit(CONF.es.settings.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (episodesData[i].type === 'metadata') continue
      if (episodesData[i].nodeId) continue
      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlCreateChildren(episodesData[i], seriesData),
            getBodyCreateFolder(episodesData[i].url),
            getHeadersCreateFolder(authObj),
            i
          ).catch((error) => {
            return error
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
          return handleResponse(response.data.node, index)
        }
      })
      .catch((error) => {
        logger.Error('[ES API] ' + error)
      })
  }

  function getUrlCreateChildren(episode, seriesData) {
    return (
      CONF.es.host.url +
      CONF.es.routes.api +
      CONF.es.routes.baseFolder +
      '/' +
      getParentNodeId(episode, seriesData) +
      '/children?' +
      getParamsCreateFolder()
    )
  }

  function getParamsCreateFolder() {
    return new URLSearchParams({
      type: 'ccm:io',
      renameIfExists: true,
      assocType: '',
      versionComment: 'MAIN_FILE_UPLOAD'
    })
  }

  function getParentNodeId(episode, seriesData) {
    if (episode.isPartOf) {
      const seriesObjFound = seriesData.find((series) => series.id === episode.isPartOf)
      return seriesObjFound ? seriesObjFound.nodeId : seriesData[0].metadata.nodeId
    } else {
      return seriesData[0].nodeId
    }
  }

  function getBodyCreateFolder(urlContent) {
    return JSON.stringify({
      'ccm:wwwurl': [urlContent],
      'ccm:linktype': ['USER_GENERATED']
    }).toString()
  }

  function getHeadersCreateFolder(authObj) {
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

  async function handleResponse(response, index) {
    addNodeIdsToEpisodeData(response, index)
  }

  function addNodeIdsToEpisodeData(response, index) {
    episodesData[index].nodeId = response.ref.id
    episodesData[index].parentId = response.parent.id
    episodesData[index].lastUpdated = new Date()
  }
}

module.exports = {
  createChildren
}

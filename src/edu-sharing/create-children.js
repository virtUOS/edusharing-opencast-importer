'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const { esAxios } = require('../services/es-axios')
const pLimit = require('p-limit')
const { ESError, ESPostError } = require('../models/errors')

async function createChildren(ocInstance, episodesData, seriesData) {
  logger.Info('[ES API] Creating children per episode for ' + ocInstance)

  return await returnReqsAsPromiseArray(episodesData, seriesData)
    .then(async (res) => {
      return episodesData
    })
    .catch((error) => {
      if (error instanceof ESError) {
        throw error
      } else throw new ESError('[ES API] Error while creating children: ' + error.message)
    })

  async function returnReqsAsPromiseArray(episodesData, seriesData) {
    const limit = pLimit(CONF.es.settings.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (episodesData[i].type === 'metadata') continue
      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlCreateChildren(episodesData[i], seriesData),
            getBodyCreateFolder(episodesData[i]),
            getHeadersCreateFolder(),
            i
          ).catch((error) => {
            if (error instanceof ESPostError) {
              throw error
            } else throw new ESError('[ES API] Error while creating children: ' + error.message)
          })
        )
      )
    }

    return Promise.allSettled(requests)
  }

  async function sendPostRequest(url, body, headers, index) {
    return await esAxios
      .post(url, body, headers)
      .then((response) => {
        if (response.status === 200) {
          return handleResponse(response.data.node, index)
        }
      })
      .catch((error) => {
        throw new ESPostError(error.message, error.code)
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
      renameIfExists: false,
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

  function getBodyCreateFolder(episodeData) {
    const filename = `${episodeData.id}-${episodeData.title
      .replace(/\s+/g, '-')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[(),!?=:;/]/g, '')
      .toLowerCase()
      .substring(0, 40)}`

    return JSON.stringify({
      'cm:name': [filename],
      'ccm:wwwurl': [episodeData.url],
      'ccm:linktype': ['USER_GENERATED']
    }).toString()
  }

  function getHeadersCreateFolder() {
    return {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'de-DE,en;q=0.7,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        locale: 'de_DE',
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

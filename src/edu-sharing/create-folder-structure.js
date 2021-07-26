'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default
const pLimit = require('p-limit')

async function createFolderForOcInstances(ocInstance, seriesData, authObj) {
  logger.Info('[ES API] Creating Edu-Sharing folder structure for ' + ocInstance)

  const modifiedSeriesData = seriesData
  const headers = getHeadersCreateFolder(authObj)
  const requests = []

  return await createMainFolder(ocInstance)
    .then(async (res) => {
      if (seriesData.length < 2 && seriesData[0].type === 'metadata') return seriesData

      const limit = pLimit(CONF.es.settings.maxPendingPromises)

      for (let i = 1; i < modifiedSeriesData.length; i++) {
        if (modifiedSeriesData[i].nodeId) continue
        if (modifiedSeriesData[i].type === 'metadata') continue
        requests.push(
          limit(() =>
            sendPostRequest(
              getUrlCreateFolder(modifiedSeriesData[0].nodeId),
              getBodyCreateFolder(
                modifiedSeriesData[i].title
                  .replace(/ /g, '-')
                  .replace(/\(|\)/g, '')
                  .toLowerCase()
                  .substring(0, 50)
              ),
              headers,
              ocInstance,
              i
            )
          )
        )
      }
    })
    .then((res) => {
      return Promise.all(requests).then((res) => {
        if (res.code === 'ECONNREFUSED') {
          logger.Error(
            '[ES API] ' + CONF.es.protocol + '://' + CONF.es.domain + ' is not reachable - skipping'
          )
        }
        return modifiedSeriesData
      })
    })
    .catch((err) => logger.Error('[ES API] ' + err))

  async function createMainFolder(ocInstance) {
    if (modifiedSeriesData[0].type === 'metadata' && !modifiedSeriesData[0].nodeId) {
      return await sendPostRequest(
        getUrlCreateFolder(),
        getBodyCreateFolder(ocInstance),
        headers,
        ocInstance,
        0
      ).catch((err) => {
        return err
      })
    }
  }

  async function sendPostRequest(url, body, headers, ocInstance, index) {
    return await axios
      .post(url, body, headers)
      .then((response) => {
        if (response.status === 200) {
          return handleResponse(response, ocInstance, index)
        }
      })
      .catch((error) => {
        if (error.code === 'ECONNREFUSED') {
          return error.code
        }
        if (error.response.status === 409) return true
        logger.Error('[ES API] ' + error)
      })
  }

  function handleResponse(res, ocInstance, index) {
    if (!res) throw Error(res)
    if (res.status === 200 && res.data.node.name === ocInstance) {
      logger.Info('[ES-API] Created main folder for ' + ocInstance)
      return addMetadataToSeriesData(res.data.node)
    } else if (res.status === 200) {
      return addNodeIdToSeries(res.data.node, index)
    }
  }

  function addMetadataToSeriesData(response) {
    if (modifiedSeriesData[0].type === 'metadata') {
      modifiedSeriesData[0].nodeId = response.ref.id
      modifiedSeriesData[0].parentId = response.parent.id
    }
  }

  function addNodeIdToSeries(response, index) {
    modifiedSeriesData[index].nodeId = response.ref.id
    modifiedSeriesData[index].parentId = response.parent.id
    modifiedSeriesData[index].lastUpdated = new Date()
  }

  function getUrlCreateFolder(nodeId) {
    const nodeRoute = nodeId ? '/' + nodeId + '/children' : '/-userhome-/children'
    return (
      CONF.es.host.url +
      CONF.es.routes.api +
      CONF.es.routes.baseFolder +
      nodeRoute +
      '/?' +
      getParamsCreateFolder()
    )
  }

  function getParamsCreateFolder() {
    return new URLSearchParams({
      type: 'cm:folder',
      renameIfExists: false
    })
  }

  function getBodyCreateFolder(folderName) {
    // const randomName = ocInstance + '-' + Math.floor(Math.random() * 100000)
    return JSON.stringify({
      'cm:name': [folderName],
      'cm:edu_metadataset': ['mds'],
      'cm:edu_forcemetadataset': ['true']
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
}

module.exports = {
  createFolderForOcInstances
}

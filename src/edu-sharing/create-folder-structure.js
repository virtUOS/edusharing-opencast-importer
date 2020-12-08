'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.json')
const axios = require('axios').default
const auth = require('./get-auth-token')

async function createFolderForOcInstances(ocInstance, seriesData) {
  const authObj = await auth.getEsAuth()
  const modifiedSeriesData = seriesData
  const headers = getHeadersCreateFolder(authObj)
  const requests = []

  return await createMainFolder()
    .then(async(res) => {
      for (let i = 1; i < modifiedSeriesData.length; i++) {
        if (modifiedSeriesData[0].metadata.nodeId) {
          requests.push(
            sendPostRequest(
              getUrlCreateFolder(modifiedSeriesData[0].metadata.nodeId),
              getBodyCreateFolder(modifiedSeriesData[i].title.replace(/ /g, '-').toLowerCase()),
              headers,
              ocInstance,
              i
            )
          )
        }
      }
    })
    .then((res) => {
      return Promise.all(requests).then((res) => {
        return modifiedSeriesData
      })
    })

  async function createMainFolder() {
    if (!modifiedSeriesData[0].metadata.nodeId) {
      return await sendPostRequest(
        getUrlCreateFolder(),
        getBodyCreateFolder(ocInstance),
        headers,
        ocInstance,
        0
      )
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
          logger.Error(
            '[ES API] ' + CONF.es.protocol + '://' + CONF.es.domain + ' is not reachable - skipping'
          )
          return true
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
    // TODO: Hacky, needs a better solution to find the metadata object in seriesData array
    modifiedSeriesData[0].metadata.nodeId = response.ref.id
    modifiedSeriesData[0].metadata.parentId = response.parent.id
  }

  function addNodeIdToSeries(response, index) {
    modifiedSeriesData[index].nodeId = response.ref.id
    modifiedSeriesData[index].parentId = response.parent.id
  }
}

function getUrlCreateFolder(nodeId) {
  const nodeRoute = nodeId ? '/' + nodeId + '/children' : '/-userhome-/children'
  return (
    CONF.es.protocol +
    '://' +
    CONF.es.domain +
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
      Host: 'localhost',
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

module.exports = {
  createFolderForOcInstances
}

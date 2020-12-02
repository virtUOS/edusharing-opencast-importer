'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.json')
const axios = require('axios').default
const auth = require('./get-auth-token')

async function createFolderForOcInstances(ocInstance, seriesData) {
  const authObj = await auth.getEsAuth()

  const url = getUrlCreateFolder()
  const body = getBodyCreateFolder(ocInstance)
  const headers = getHeadersCreateFolder(authObj)

  return await sendPostRequest(url, body, headers)
    .then((res) => {
      if (!res) throw Error(res)
      if (res.status === 200) {
        return addNodeIdToSeriesData(res.data.node, seriesData)
      } else {
        if (res.status === 409) logger.Info('[ES-API] 409 Folder ' + ocInstance + ' exists')
        return seriesData
      }
    })
    .catch((error) => console.log(error))
}

function getUrlCreateFolder() {
  return (
    CONF.es.protocol +
    '://' +
    CONF.es.domain +
    CONF.es.routes.api +
    CONF.es.routes.createFolder +
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

function getBodyCreateFolder(ocInstance) {
  // const randomName = ocInstance + '-' + Math.floor(Math.random() * 100000)
  return JSON.stringify({
    'cm:name': [ocInstance],
    'cm:edu_metadataset': ['mds'],
    'cm:edu_forcemetadataset': ['true']
  })
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

async function sendPostRequest(url, body, headers) {
  return await axios
    .post(url, body, headers)
    .then((response) => {
      console.log(response)
      if (response.status === 200) {
        return response
      }
    })
    .catch((error) => {
      if (error.code === 'ECONNREFUSED') {
        logger.Error(
          '[ES API] Edu-sharing is not reachable: ' + CONF.es.protocol + '://' + CONF.es.domain
        )
      }
      if (!error.response.code === 409) logger.Error('[ES API] ' + error)
      return error.response
    })
}

function addNodeIdToSeriesData(response, seriesData) {
  // TODO: Hacky, needs a better solution to find the metadata object in seriesData array
  seriesData[0].metadata.nodeId = response.ref.id
  seriesData[0].metadata.parentId = response.parent.idd

  return seriesData
}

module.exports = {
  createFolderForOcInstances
}

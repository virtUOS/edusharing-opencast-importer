'use strict'

require('dotenv').config()
require('axios-debug-log')
const CONF = require('../config/config')
const { esAxios } = require('../services/es-axios')
const { ESError } = require('../models/errors')

async function checkExistingDirs(ocInstance, authObj) {
  let mainDirID = ''

  // obj to store all existing ES diretories
  let esDirectories = []

  // get nodeID of home directory
  await esAxios
    .get(getUrlMainFolder(), getHeadersMetadata())
    .then((response) => {
      mainDirID = response.data.node.ref.id
    })
    .catch((err) => {
      throw new ESError('[ES API] Error while fetching existent ES-Folder: ' + err.message)
    })

  // get nodeID of ocInstance directory if it exists
  await esAxios
    .get(getUrlChildFolders(mainDirID), getHeadersMetadata())
    .then(async (response) => {
      response.data.nodes.forEach(async (node) => {
        if (node.name === ocInstance && node.isDirectory === true) {
          // safe info
          esDirectories = node
        }
      })
      // if ocInstance directory does not exist
      if (esDirectories.length === 0) return esDirectories

      // get all existing subdirectories + nodeIDs
      await esAxios
        .get(getUrlChildFolders(esDirectories.ref.id), getHeadersMetadata())
        .then(async (response) => {
          // safe data
          const subDirs = []
          response.data.nodes.forEach((node) => {
            if (node.isDirectory === true) {
              subDirs.push(node)
            }
          })
          esDirectories.nodes = subDirs
        })
        .catch((err) => {
          throw new ESError('[ES API] Error while fetching existent ES-Folder: ' + err.message)
        })
    })
    .catch((err) => {
      throw new ESError('[ES API] Error while fetching existent ES-Folder: ' + err.message)
    })
  return esDirectories
}

function getUrlMainFolder() {
  return CONF.es.host.url + CONF.es.routes.api + CONF.es.routes.baseFolder + '/-userhome-/metadata'
}

function getUrlChildFolders(nodeId) {
  return (
    CONF.es.host.url +
    CONF.es.routes.api +
    CONF.es.routes.baseFolder +
    '/' +
    nodeId +
    '/children?maxItems=500&skipCount=0'
  )
}

function getHeadersMetadata() {
  return {
    headers: {
      Accept: 'application/json'
    }
  }
}

module.exports = {
  checkExistingDirs
}

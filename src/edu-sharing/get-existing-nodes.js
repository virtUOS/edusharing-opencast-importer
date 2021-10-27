'use strict'

require('dotenv').config()
require('axios-debug-log')
const CONF = require('../config/config')
const { esAxios } = require('../services/es-axios')
const { ESError } = require('../models/errors')

async function checkExistingDirs(ocInstance) {
  let mainDirID = ''

  // obj to store all existing ES diretories
  let esDirectories = []

  try {
    // get nodeID of home directory
    const homeResponse = await esAxios.get(getUrlMainFolder(), getHeadersMetadata())
    mainDirID = homeResponse.data.node.ref.id

    // get nodeID of ocInstance directory if it exists
    const ocInstanceResponse = await esAxios.get(
      getUrlChildFolders(mainDirID),
      getHeadersMetadata()
    )
    ocInstanceResponse.data.nodes.forEach((node) => {
      if (node.name === ocInstance && node.isDirectory === true) {
        // safe info
        esDirectories = node
      }
    })
    // if ocInstance directory does not exist
    if (esDirectories.length === 0) return esDirectories

    // get all existing subdirectories + nodeIDs
    const ocSubResponse = await esAxios.get(
      getUrlChildFolders(esDirectories.ref.id),
      getHeadersMetadata()
    )

    // safe data
    const subDirs = []
    ocSubResponse.data.nodes.forEach((node) => {
      if (node.isDirectory === true) {
        subDirs.push(node)
      }
    })
    esDirectories.nodes = subDirs
  } catch (error) {
    throw new ESError('[ES API] Error while fetching existent ES-Folder: ' + error.message)
  }
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

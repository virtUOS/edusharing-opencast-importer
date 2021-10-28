'use strict'

require('dotenv').config()
require('axios-debug-log')
const CONF = require('../config/config')
const { esAxios } = require('../services/es-axios')
const { ESError } = require('../models/errors')

async function checkExistingCollections(orgName) {
  // obj to store all existing ES collections
  let esCollections = []

  try {
    // get ID of ocInstance collection if it exists
    const ocCollResponse = await esAxios.get(getUrlChildCollections(), getHeadersCheck())
    ocCollResponse.data.collections.forEach((collection) => {
      if (collection.title === orgName) {
        // safe info
        esCollections = collection
      }
    })

    // if ocInstance collection does not exist
    if (esCollections.length === 0) return esCollections

    // get all existing subcollections + IDs
    const ocSubResponse = await esAxios.get(
      getUrlChildCollections(esCollections.ref.id),
      getHeadersCheck()
    )

    // safe data
    const subColls = []
    ocSubResponse.data.collections.forEach((collection) => {
      subColls.push(collection)
    })
    esCollections.collections = subColls
  } catch (error) {
    throw new ESError('[ES API] Error while fetching existent ES-Collection: ' + error.message)
  }
  return esCollections
}

function getUrlChildCollections(nodeId) {
  const nodeRoute = nodeId ? '/' + nodeId + '/children' : '/-root-/children'
  return (
    CONF.es.host.url +
    CONF.es.routes.collections +
    CONF.es.routes.baseFolder +
    '/' +
    nodeRoute +
    '/collections?scope=MY&maxItems=500&skipCount=0'
  )
}

function getHeadersCheck() {
  return {
    headers: {
      Accept: 'application/json'
    }
  }
}

module.exports = {
  checkExistingCollections
}

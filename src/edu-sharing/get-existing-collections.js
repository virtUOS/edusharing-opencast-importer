'use strict'

require('dotenv').config()
require('axios-debug-log')
const CONF = require('../config/config')
const { esAxios } = require('../services/es-axios')
const { ESError } = require('../models/errors')

async function checkExistingCollections(ocInstance) {
  // obj to store all existing ES collections
  let esCollections = []

  // get ID of ocInstance collection if it exists
  await esAxios
    .get(getUrlChildCollections(), getHeadersCheck())
    .then(async (response) => {
      response.data.collections.forEach(async (collection) => {
        if (collection.title === ocInstance) {
          // safe info
          esCollections = collection
        }
      })
      // if ocInstance collection does not exist
      if (esCollections.length === 0) return esCollections

      // get all existing subcollections + IDs
      await esAxios
        .get(getUrlChildCollections(esCollections.ref.id), getHeadersCheck())
        .then(async (response) => {
          // safe data
          const subColls = []
          response.data.collections.forEach((collection) => {
            subColls.push(collection)
          })
          esCollections.collections = subColls
        })
        .catch((err) => {
          throw new ESError('[ES API] Error while fetching existent ES-Collection: ' + err.message)
        })
    })
    .catch((err) => {
      throw new ESError('[ES API] Error while fetching existent ES-Collection: ' + err.message)
    })
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

'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const pLimit = require('p-limit')
const { OCError, OCGetError } = require('../models/errors')

async function start(ocEpisodes, force, ocInstanceObj) {
  const ocInstance = ocInstanceObj.domain
  if (force) logger.Info('[OC Episodes] Force episodes GET requests for ' + ocInstance)
  if (ocEpisodes && !force) {
    if (ocEpisodes.length > 0) {
      logger.Info('[OC Episodes] ' + ocEpisodes.length + ' Episodes found for ' + ocInstance)
      return ocEpisodes
    }
  }

  let instanceMetadata = { pageCurrent: 0 }
  const episodes = []
  const episodesIds = new Set()

  const url = getUrlForRequest(
    ocInstanceObj.protocol,
    ocInstance,
    CONF.oc.routes.getAllEpisodes,
    CONF.oc.settings.requestOffset
  )

  function getUrlForRequest(proto, domain, route, limit) {
    return proto + '://' + domain + route + '?sort=DATE_CREATED' + '&limit=' + limit
  }

  function setInstanceMetadata(data) {
    if (!instanceMetadata.limit && !instanceMetadata.total) {
      instanceMetadata = {
        limit: data.limit,
        total: data.total,
        pageMax: Math.round(data.total / data.limit)
      }
    }
  }

  async function sendGetRequest(url, offset) {
    url = url + '&offset=' + offset
    return await axios
      .get(url)
      .then((response) => {
        return response.data['search-results']
      })
      .catch((error) => {
        throw new OCGetError(error.message, error.code)
      })
  }

  async function handleResponse(data) {
    return pushEpisodesToArray(data.result)
  }

  async function pushEpisodesToArray(results) {
    if (!Array.isArray(results)) results = [results]
    for (let i = 0; i < results.length; i++) {
      if (!episodesIds.has(results[i].id)) {
        episodesIds.add(results[i].id)
        episodes.push(results[i])
      }
    }
  }

  async function returnReqsAsPromiseArray(url) {
    const limit = pLimit(CONF.oc.settings.maxPendingPromises)
    const requests = []
    const pageMax = instanceMetadata.pageMax ? instanceMetadata.pageMax : 1

    for (let i = 0; i <= pageMax; i++) {
      requests.push(
        limit(() =>
          sendGetRequest(url, i * CONF.oc.settings.requestOffset)
            .then(async (data) => {
              if (data.result) {
                return await handleResponse(data)
              }
            })
            .catch((error) => {
              if (error instanceof OCGetError) {
                throw error
              } else {
                throw new OCError('[OC API] Error while receiving episode data: ' + error.message)
              }
            })
        )
      )
    }

    return Promise.all(requests)
  }

  return await sendGetRequest(url, 0) // send first GET request seperated from promise loop for instance metadata
    .then((data) => {
      if (data.total > 0) setInstanceMetadata(data)
    })
    .then(async () => {
      logger.Info('[OC Episodes] Start sending GET requests: ' + ocInstance)
      return returnReqsAsPromiseArray(url)
    })
    .then(() => {
      logger.Info('[OC Episodes] All promissed resolved: ' + ocInstance)
      if (episodes.length < 1) logger.Info('[OC Episodes] No public episodes found: ' + ocInstance)
      return episodes
    })
    .catch((error) => {
      if (error instanceof OCError) {
        throw error
      } else throw new OCError('[OC API] Error while receiving episode data: ' + error.message)
    })
}

module.exports.start = start

'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const pLimit = require('p-limit')

async function start(ocEpisodes, force, ocInstance) {
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
    CONF.oc.protocol,
    CONF.oc.develop.useDevDomain ? CONF.oc.domainDev : CONF.oc.domain,
    CONF.oc.routes.getAllEpisodes,
    CONF.oc.requestOffset
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
      .catch((error) => logger.Error(error))
  }

  async function handleResponse(data) {
    return pushEpisodesToArray(data.result)
  }

  async function pushEpisodesToArray(results) {
    for (let i = 0; i < results.length; i++) {
      if (!episodesIds.has(results[i].id)) {
        episodesIds.add(results[i].id)
        episodes.push(results[i])
      }
    }
  }

  async function returnReqsAsPromiseArray(url) {
    const limit = pLimit(CONF.oc.maxPendingPromises)
    const requests = []
    const pageMax = instanceMetadata.pageMax ? instanceMetadata.pageMax : 1

    for (let i = 0; i < pageMax; i++) {
      requests.push(
        limit(() =>
          sendGetRequest(url, i * CONF.oc.requestOffset)
            .then(async (data) => {
              if (data.result) {
                return await handleResponse(data)
              } else {
                logger.Info('No public episodes ( ' + url + ')')
              }
            })
            .catch((error) => logger.Error(error))
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
      return episodes
    })
    .catch((error) => logger.Error(error))
}

module.exports.start = start

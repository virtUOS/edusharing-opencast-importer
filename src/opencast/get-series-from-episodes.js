'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const pLimit = require('p-limit')
const { OCError, OCGetError } = require('../models/errors')

async function start(episodes, ocSeries, force, ocInstance, ocInstanceObj) {
  if (force) logger.Info('[OC Series] Force sending GET requests for ' + ocInstance)
  if (ocSeries && !force) {
    if (ocSeries.length > 0) {
      logger.Info('[OC Series] ' + ocSeries.length + ' Series found for ' + ocInstance)
      return ocSeries
    }
  }

  function extractSeriesIdsFromEpisodes(episodes) {
    const seriesIds = []

    for (let i = 0; i < episodes.length; i++) {
      const seriesId = episodes[i].dcIsPartOf
      if (seriesId && !seriesIds.includes(seriesId)) seriesIds.push(seriesId)
    }

    return seriesIds
  }

  function getUrlForRequest(proto, domain, route) {
    return proto + '://' + domain + route + '?sort=DATE_CREATED'
  }

  const url = getUrlForRequest(ocInstanceObj.protocol, ocInstance, CONF.oc.routes.getSeriesById)

  async function sendGetRequest(url, seriesId) {
    url = url + '&id=' + seriesId

    return await axios
      .get(url)
      .then((response) => {
        return response.data['search-results']
      })
      .catch((error) => {
        throw new OCGetError(error.message, error.code)
      })
  }

  async function getSeriesById(url, seriesIds) {
    logger.Info('[OC Series] Start sending GET requests: ' + ocInstance)

    const limit = pLimit(CONF.oc.settings.maxPendingPromises)
    const requests = []

    for (let i = 0; i < seriesIds.length; i++) {
      requests.push(
        limit(() =>
          sendGetRequest(url, seriesIds[i])
            .then(async (data) => {
              if (data.result) {
                return data.result
              }
            })
            .catch((error) => {
              if (error instanceof OCGetError) {
                throw error
              } else {
                throw new OCError('[OC API] Error while receiving series data: ' + error.message)
              }
            })
        )
      )
    }

    return Promise.all(requests)
  }

  const seriesIds = extractSeriesIdsFromEpisodes(episodes)

  return await getSeriesById(url, seriesIds)
    .then((seriesData) => {
      logger.Info('[OC Series] All promissed resolved: ' + ocInstance)
      return seriesData.filter((value) => value !== undefined)
    })
    .catch((error) => {
      if (error instanceof OCError) {
        throw error
      } else throw new OCError('[OC API] Error while receiving series data: ' + error.message)
    })
}

module.exports.start = start

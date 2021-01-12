'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const pLimit = require('p-limit')

async function start(episodes, ocSeries, force, ocInstance) {
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

  const url = getUrlForRequest(
    CONF.oc.instances[0].protocol,
    CONF.oc.instances[0].domain,
    CONF.oc.routes.getSeriesById
  )

  async function sendGetRequest(url, seriesId) {
    url = url + '&id=' + seriesId

    return await axios
      .get(url)
      .then((response) => {
        return response.data['search-results']
      })
      .catch((error) => logger.Error(error))
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
            .catch((error) => logger.Error(error))
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
    .catch((error) => logger.Error(error))
}

module.exports.start = start

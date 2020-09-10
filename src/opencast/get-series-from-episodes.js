'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.json')

async function start(episodes) {
  logger.Info('Start getting series ids from episodes')

  function extractSeriesIdsFromEpisodes(episodes) {
    const seriesIds = []

    for (let i = 0; i < episodes.length; i++) {
      const seriesId = episodes[i].dcIsPartOf
      if ((seriesId) && !seriesIds.includes(seriesId)) seriesIds.push(seriesId)
    }

    return seriesIds
  }

  function getUrlForRequest(proto, domain, route) {
    return proto + '://' + domain + route + '?sort=DATE_CREATED'
  }

  const url = getUrlForRequest(
    CONF.oc.protocol,
    (CONF.oc.develop.useDevDomain ? CONF.oc.domainDev : CONF.oc.domain),
    CONF.oc.routes.getSeriesById)

  async function sendGetRequest(url, seriesId) {
    url = url + '&id=' + seriesId

    return await axios.get(url)
      .then(response => {
        return response.data['search-results']
      })
      .catch(error => logger.Error(error))
  }

  async function getSeriesById(url, seriesIds) {
    logger.Info('[Series] Start sending GET requests: ' + url)

    const requests = []

    for (let i = 0; i < seriesIds.length; i++) {
      requests.push(await sendGetRequest(url, seriesIds[i])
        .then(async(data) => {
          if (data.result) {
            return data.result
          } else {
            logger.Warn('No series found for ID: ' + seriesIds[i])
          }
        })
        .catch(error => logger.Error(error))
      )
    }

    return Promise.all(requests)
  }

  const seriesIds = extractSeriesIdsFromEpisodes(episodes)

  return await getSeriesById(url, seriesIds)
    .then((seriesData) => {
      logger.Info('[Series] All promissed resolved: ' + url)
      return seriesData.filter(value => value !== undefined)
    })
    .catch(error => logger.Error(error))
}

module.exports.start = start

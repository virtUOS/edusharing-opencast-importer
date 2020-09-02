'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.json')

async function start() {
  let instanceMetadata = { pageCurrent: 0 }
  const episodes = []

  const url = getUrlForRequest(
    CONF.oc.protocol,
    (CONF.oc.develop.useDevDomain ? CONF.oc.domainDev : CONF.oc.domain),
    CONF.oc.routes.getAllEpisodes,
    CONF.oc.requestLimit)

  function getUrlForRequest(proto, domain, route, limit) {
    return proto + '://' + domain + route + '?sort=DATE_CREATED' + '&limit=' + limit
  }

  async function sendGetRequest(url, page) {
    url = url + '&offset=' + page
    logger.Info('GET: ' + url)
    return await axios.get(url)
      .then(response => {
        logger.Info(response.status + ': get request OK')
        return response.data['search-results']
      })
      .catch(error => logger.Error(error))
  }

  async function handleResponse(data) {
    return pushEpisodesToArray(data.result)
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

  async function pushEpisodesToArray(results) {
    for (let i = 0; i < results.length; i++) {
      episodes.push(results[i])
    }
  }

  async function returnReqsAsPromiseArray(url) {
    console.log('-- START SENDING PROMISSES')
    const requests = []
    const pageMax = instanceMetadata.pageMax ? instanceMetadata.pageMax : 1

    for (let i = 0; i < pageMax; i++) {
      console.log(i + '/' + instanceMetadata.pageMax)

      requests.push(await sendGetRequest(url, i)
        .then(async(data) => {
          if (data.result) {
            return await handleResponse(data)
          } else {
            logger.Warn('No public episodes ( ' + url + ')')
          }
        })
        .catch((error) => logger.Error(error))
      )
    }

    return Promise.all(requests)
  }

  return await sendGetRequest(url, 0) // send first GET request seperated from promise loop for instance metadata
    .then(data => {
      if (data.total > 0) setInstanceMetadata(data)
    })
    .then(async() => {
      console.log(instanceMetadata)
      return returnReqsAsPromiseArray(url)
    })
    .then(() => {
      console.log('-- ALL PROMISSES RESOLVED')
      return episodes
    })
    .catch(error => logger.Error(error))
}

module.exports.start = start

'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.json')

function getAllPublishedEpisodes() {
  let instanceMetadata = { pageCurrent: 0 }
  const episodes = []

  function getOpencastApiUrl(config, page) {
    return config.oc.protocol +
    '://' +
    (config.oc.develop.useDevDomain ? config.oc.domainDev : config.oc.domain) +
    config.oc.routes.getAllEpisodes +
    '?limit=' + config.oc.requestLimit +
    '&offset=' + page
  }

  async function sendGetRequest(page) {
    const url = getOpencastApiUrl(CONF, page)
    logger.Info('GET: ' + url)
    return axios.get(url)
      .then(response => {
        logger.Info(response.status + ': get request OK')
        setInstanceMetadata(response.data['search-results'], page)
        return response.data['search-results']
      })
      .catch(error => {
        logger.Error(error.message)
      })
  }

  function handleResponse(data) {
    pushEpisodesToArray(data.result)
  }

  function setInstanceMetadata(data, page) {
    if (!instanceMetadata.limit && !instanceMetadata.total) {
      instanceMetadata = {
        limit: data.limit,
        total: data.total,
        pageCurrent: page,
        pageMax: Math.round(data.total / data.limit)
      }
    }
  }

  function pushEpisodesToArray(results) {
    for (let i = 0; i < results.length; i++) {
      episodes.push(results[i])
    }
  }

  async function main() {
    for (let i = 0; i < instanceMetadata.pageMax ? instanceMetadata.pageMax : 1; i++) {
      console.log(i)
      console.log(instanceMetadata.pageMax)
      await sendGetRequest(i)
        .then(data => {
          handleResponse(data)
        })
    }
  }

  main()
}

module.exports.getAllPublishedEpisodes = getAllPublishedEpisodes

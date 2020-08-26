'use strict'
const axios = require('axios').default
const logger = require('node-file-logger')
const CONF = require('../config/config.json')

function getPublishedEpisodes() {
  const url =
    CONF.oc.protocol +
    '://' +
    CONF.oc.domain +
    CONF.oc.routes.getAllEpisodes

  axios.get(url)
    .then(res => {
      logger.Info(res.status + ': get request OK')
      return res.data['search-results']
    })
    .catch(error => {
      logger.Error(error)
    })
}

module.exports.getPublishedEpisodes = getPublishedEpisodes

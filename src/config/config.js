'use strict'
require('dotenv').config()
const ocInstances = require('./config.oc-instances')
const config = {}

config.es = {
  host: {
    proto: process.env.ES_HOST_PROTO,
    domain: process.env.ES_HOST_DOMAIN,
    url: `${process.env.ES_HOST_PROTO}://${process.env.ES_HOST_DOMAIN}`
  },
  settings: {
    maxPendingPromises: 1
  },
  routes: {
    api: '/edu-sharing/rest/node/v1/nodes',
    oauth: '/edu-sharing/oauth2/token',
    baseFolder: '/-home-',
    validation: '/edu-sharing/rest/authentication/v1/validateSession'
  }
}

config.oc = {
  forceUpdate: false,
  instances: ocInstances,
  settings: {
    maxPendingPromises: 2,
    requestOffset: 5
  },
  routes: {
    getAllEpisodes: '/search/episode.json',
    getSeriesById: '/search/series.json'
  },
  filenames: {
    episodes: 'ocEpisodes.json',
    series: 'ocSeries.json',
    episodesData: 'episodesData.json',
    seriesData: 'seriesData.json'
  }
}

config.logger = {
  folderPath: './logs/',
  dateBasedFileNaming: true,
  fileNamePrefix: 'es-oc-importer_',
  fileNameExtension: '.log',
  timeZone: 'Europe/Berlin',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  logLevel: 'debug',
  onlyFileLogging: false
}

config.filter = {
  allowedLicences: ['CC0', 'CC-BY', 'CC-BY-SA', 'PD', 'PDM']
}

module.exports = config

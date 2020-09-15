'use strict'
require('dotenv').config()
const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const storage = require('./services/data-storage.js')
const getAllPublishedEpisodes = require('./opencast/get-all-published-episodes.js')
const getSeriesIdsFromEpisodes = require('./opencast/get-series-from-episodes.js')

async function main() {
  logger.SetUserOptions(CONF.logger)
  logger.Info('Application started')

  let ocEpisodes = []
  let ocSeries = []

  getAllPublishedEpisodes.start()
    .then(async(episodes) => {
      ocEpisodes = episodes
      storage.storeData(CONF.oc.filenames.episodes, episodes)
      return await getSeriesIdsFromEpisodes.start(episodes)
    })
    .then((series) => {
      ocSeries = series
      console.log(ocEpisodes.length)
      console.log(ocSeries.length)
      storage.storeData(CONF.oc.filenames.series, series)
    })
    .catch(error => logger.Error(error))
}

main()

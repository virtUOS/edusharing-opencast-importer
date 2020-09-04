'use strict'
const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const storage = require('./services/data-storage.js')
const getAllPublishedEpisodes = require('./opencast/get-all-published-episodes.js')
const getSeriesIdsFromEpisodes = require('./opencast/get-series-from-episodes.js')

logger.SetUserOptions(CONF.logger)

async function main() {
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
      storage.storeData(CONF.oc.filenames.series, series)
      console.log(ocEpisodes.length)
      console.log(ocSeries.length)
    })
    .catch(error => logger.Error(error))
}

main()

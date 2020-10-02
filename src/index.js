'use strict'
require('dotenv').config()
const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const storage = require('./services/data-storage.js')
const getAllPublishedEpisodes = require('./opencast/get-all-published-episodes.js')
const getSeriesIdsFromEpisodes = require('./opencast/get-series-from-episodes.js')
const sorter = require('./services/sorter.js')

async function main() {
  logger.SetUserOptions(CONF.logger)
  logger.Info('Application started')

  let ocEpisodes = await storage.loadData(CONF.oc.filenames.episodes)
  let ocSeries = await storage.loadData(CONF.oc.filenames.series)
  let sortedEpisodesPerSeries = await storage.loadData(
    CONF.oc.filenames.sortedEpisodes
  )

  getAllPublishedEpisodes
    .start(ocEpisodes, true)
    .then(async(episodes) => {
      ocEpisodes = episodes
      // storage.storeData(CONF.oc.filenames.episodes, episodes)
      return await getSeriesIdsFromEpisodes.start(episodes, ocSeries, false)
    })
    .then((series) => {
      ocSeries = series
      console.log(ocEpisodes.length)
      console.log(ocSeries.length)
      // storage.storeData(CONF.oc.filenames.series, series)
      sortedEpisodesPerSeries = sorter.getSortedEpisodesPerSeriesIds(
        series,
        ocEpisodes
      )
      // storage.storeData(CONF.oc.filenames.sortedEpisodes, sortedEpisodesPerSeries)
      console.log(sortedEpisodesPerSeries.length)
    })
    .catch((error) => logger.Error(error))
}

main()

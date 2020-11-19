'use strict'
require('dotenv').config()
const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const storage = require('./services/data-storage.js')
const getAllPublishedEpisodes = require('./opencast/get-all-published-episodes.js')
const getSeriesIdsFromEpisodes = require('./opencast/get-series-from-episodes.js')
const sorter = require('./services/sorter.js')
const filter = require('./services/filter-episodes')

async function main() {
  logger.SetUserOptions(CONF.logger)
  logger.Info('Application started')

  let ocEpisodes
  let ocSeries
  let sortedEpisodesPerSeries

  async function initStoredData() {
    ocEpisodes = await storage.loadData(CONF.oc.filenames.episodes)
    ocSeries = await storage.loadData(CONF.oc.filenames.series)
    sortedEpisodesPerSeries = await storage.loadData(CONF.oc.filenames.sortedEpisodes)
  }

  initStoredData().then(() => {
    getAllPublishedEpisodes
      .start(ocEpisodes, false)
      .then(async(episodes) => {
        ocEpisodes = filter.filterAllowedLicensedEpisodes(episodes, CONF.filter.allowedLicences)
        // storage.storeData(CONF.oc.filenames.episodes, episodes)
        return await getSeriesIdsFromEpisodes.start(ocEpisodes, ocSeries, false)
      })
      .then((series) => {
        ocSeries = series
        // storage.storeData(CONF.oc.filenames.series, series)
        sortedEpisodesPerSeries = sorter.getSortedEpisodesPerSeriesIds(ocSeries, ocEpisodes)
        storage.storeData(CONF.oc.filenames.sortedEpisodes, sortedEpisodesPerSeries)
        console.log(sortedEpisodesPerSeries.length)
      })
      .catch((error) => logger.Error(error))
  })
}

main()

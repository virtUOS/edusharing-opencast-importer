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
  logger.Info('[Application] Started')

  let ocEpisodes
  let ocSeries
  let seriesData
  let uniqueEpisodes
  let episodesData
  const ocInstance = CONF.oc.develop.useDevDomain ? CONF.oc.domainDev : CONF.oc.domain

  async function initStoredData() {
    ocEpisodes = await storage.loadData(CONF.oc.filenames.episodes, ocInstance)
    ocSeries = await storage.loadData(CONF.oc.filenames.series, ocInstance)
    seriesData = await storage.loadData(CONF.oc.filenames.sortedEpisodeIdsPerSeries, ocInstance)
  }

  initStoredData().then(() => {
    getAllPublishedEpisodes
      .start(ocEpisodes, false)
      .then(async(episodes) => {
        ocEpisodes = filter.filterAllowedLicensedEpisodes(episodes, CONF.filter.allowedLicences)
        // storage.storeData(CONF.oc.filenames.episodes, episodes, ocInstance)
        return await getSeriesIdsFromEpisodes.start(ocEpisodes, ocSeries, false)
      })
      .then((series) => {
        ocSeries = series
        // storage.storeData(CONF.oc.filenames.series, series, ocInstance)
        seriesData = sorter.getSortedEpisodesPerSeriesIds(ocSeries, ocEpisodes, ocInstance)
        return seriesData
      })
      .then((seriesData) => {
        uniqueEpisodes = sorter.getUniqueEpisodesObjects(ocEpisodes, seriesData)
        return uniqueEpisodes
      })
      .then((uniqueEpisodes) => {
        episodesData = sorter.applyEpisodeData(uniqueEpisodes, ocEpisodes, ocInstance)
        storage.storeData(CONF.oc.filenames.episodesData, episodesData, ocInstance)
      })
      .catch((error) => logger.Error(error))
  })
}

main()

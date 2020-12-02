'use strict'
require('dotenv').config()
require('axios-debug-log')
const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const storage = require('./services/data-storage.js')
const getAllPublishedEpisodes = require('./opencast/get-all-published-episodes.js')
const getSeriesIdsFromEpisodes = require('./opencast/get-series-from-episodes.js')
const sorter = require('./services/sorter.js')
const filter = require('./services/filter-episodes')
const esFolders = require('./edu-sharing/create-folder-structure.js')

async function main() {
  logger.SetUserOptions(CONF.logger)
  logger.Info('[Application] Started')

  let ocEpisodes
  let ocSeries
  let seriesData
  let episodesData
  const ocInstance = CONF.oc.develop.useDevDomain ? CONF.oc.domainDev : CONF.oc.domain
  const forceUpdate = false

  async function initStoredData() {
    ocEpisodes = await storage.loadData(CONF.oc.filenames.episodes, ocInstance)
    ocSeries = await storage.loadData(CONF.oc.filenames.series, ocInstance)
    episodesData = await storage.loadData(CONF.oc.filenames.episodesData, ocInstance)
    seriesData = await storage.loadData(CONF.oc.filenames.seriesData, ocInstance)
  }

  initStoredData().then(() => {
    getAllPublishedEpisodes
      .start(ocEpisodes, forceUpdate, ocInstance)
      .then(async(episodes) => {
        ocEpisodes = filter.filterAllowedLicensedEpisodes(episodes, CONF.filter.allowedLicences)
        storage.storeData(CONF.oc.filenames.episodes, episodes, ocInstance)
        return await getSeriesIdsFromEpisodes.start(ocEpisodes, ocSeries, forceUpdate, ocInstance)
      })
      .then(async(series) => {
        storage.storeData(CONF.oc.filenames.series, series, ocInstance)
        seriesData = sorter.getSortedEpisodesPerSeriesIds(
          ocSeries,
          ocEpisodes,
          ocInstance,
          seriesData
        )
        episodesData = sorter.applyEpisodeData(
          sorter.getUniqueEpisodesObjects(ocEpisodes, seriesData),
          ocEpisodes,
          ocInstance
        )
        storage.storeData(CONF.oc.filenames.episodesData, episodesData, ocInstance)
        seriesData = await esFolders.createFolderForOcInstances(ocInstance, seriesData)
        return seriesData
      })
      .then(async(seriesData) => {
        storage.storeData(CONF.oc.filenames.seriesData, seriesData, ocInstance)
      })
      .catch((error) => logger.Error(error))
  })
}

main()

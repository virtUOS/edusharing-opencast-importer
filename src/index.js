'use strict'
require('dotenv').config()
require('axios-debug-log')
const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const storage = require('./services/data-storage')
const getAllPublishedEpisodes = require('./opencast/get-all-published-episodes')
const getSeriesIdsFromEpisodes = require('./opencast/get-series-from-episodes')
const sorter = require('./services/sorter')
const filter = require('./services/filter-episodes')
const esAuth = require('./edu-sharing/get-auth-token')
const esFolders = require('./edu-sharing/create-folder-structure')
const esChildren = require('./edu-sharing/create-children')

async function main() {
  logger.SetUserOptions(CONF.logger)
  logger.Info('[Application] Started')

  let ocEpisodes
  let ocSeries
  let seriesData
  let episodesData
  const ocInstance = CONF.oc.develop.useDevDomain ? CONF.oc.domainDev : CONF.oc.domain
  const authObj = await esAuth.getEsAuth()
  const forceUpdate = false

  async function initStoredData() {
    ocEpisodes = await storage.loadData(CONF.oc.filenames.episodes, ocInstance)
    ocSeries = await storage.loadData(CONF.oc.filenames.series, ocInstance)
    episodesData = await storage.loadData(CONF.oc.filenames.episodesData, ocInstance)
    seriesData = await storage.loadData(CONF.oc.filenames.seriesData, ocInstance)
  }

  async function storeData() {
    storage.storeData(CONF.oc.filenames.episodes, ocEpisodes, ocInstance)
    storage.storeData(CONF.oc.filenames.series, ocSeries, ocInstance)
    storage.storeData(CONF.oc.filenames.episodesData, episodesData, ocInstance)
    storage.storeData(CONF.oc.filenames.seriesData, seriesData, ocInstance)
  }

  initStoredData().then(() => {
    getAllPublishedEpisodes
      .start(ocEpisodes, forceUpdate, ocInstance)
      .then(async (episodes) => {
        ocEpisodes = filter.filterAllowedLicensedEpisodes(episodes, CONF.filter.allowedLicences)
        return await getSeriesIdsFromEpisodes.start(ocEpisodes, ocSeries, forceUpdate, ocInstance)
      })
      .then(async (series) => {
        ocSeries = series
        seriesData = sorter.getSortedEpisodesPerSeriesIds(
          ocSeries,
          ocEpisodes,
          ocInstance,
          seriesData
        )
        episodesData = sorter.applyEpisodeData(
          sorter.getUniqueEpisodesObjects(ocEpisodes, seriesData),
          ocEpisodes,
          ocInstance,
          episodesData
        )
        storeData()
        return await esFolders.createFolderForOcInstances(ocInstance, seriesData, authObj)
      })
      .then((seriesDataWithMetadata) => {
        seriesData = seriesDataWithMetadata
        storeData()
        return esChildren.createChildren(ocInstance, episodesData, seriesData, authObj)
      })
      .then((res) => {
        console.log('end')
      })
      .then(() => storeData())
      .catch((error) => logger.Error(error))
  })
}

main()

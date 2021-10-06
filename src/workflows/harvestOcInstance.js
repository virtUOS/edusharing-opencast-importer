'use strict'
require('dotenv').config()
require('axios-debug-log')
const logger = require('node-file-logger')
const CONF = require('../config/config')

const storage = require('../services/data-storage')
const getAllPublishedEpisodes = require('../opencast/get-all-published-episodes')
const getSeriesIdsFromEpisodes = require('../opencast/get-series-from-episodes')
const sorter = require('../services/sorter')
const filter = require('../services/filter-episodes')
const esAuth = require('../edu-sharing/get-auth-token')
const esAxiosService = require('../services/es-axios')
const esFolders = require('../edu-sharing/create-folder-structure')
const esChildren = require('../edu-sharing/create-children')
const esMetadata = require('../edu-sharing/update-metadata')
const esPermissions = require('../edu-sharing/update-permissions')
const { NoSavedDataError } = require('../models/errors')

async function harvestOcInstance(ocInstanceObj, forceUpdate) {
  const ocInstance = ocInstanceObj.domain
  let ocEpisodes
  let ocSeries
  let seriesData
  let episodesData

  async function initStoredData() {
    const dataPromises = [
      storage.loadData(CONF.oc.filenames.episodes, ocInstance),
      storage.loadData(CONF.oc.filenames.series, ocInstance),
      storage.loadData(CONF.oc.filenames.episodesData, ocInstance),
      storage.loadData(CONF.oc.filenames.seriesData, ocInstance)
    ]
    const loadedData = await Promise.allSettled(dataPromises)
    ocEpisodes = loadedData[0].status === 'fulfilled' ? loadedData[0].value : []
    ocSeries = loadedData[1].status === 'fulfilled' ? loadedData[1].value : []
    episodesData = loadedData[2].status === 'fulfilled' ? loadedData[2].value : []
    seriesData = loadedData[3].status === 'fulfilled' ? loadedData[3].value : []

    for (const data in loadedData) {
      if (loadedData[data].status === 'rejected') {
        if (loadedData[data].reason instanceof NoSavedDataError) {
          logger.Info(loadedData[data].reason.message)
        } else {
          throw loadedData[data].reason
        }
      }
    }
  }

  async function storeData() {
    storage.storeData(CONF.oc.filenames.episodes, ocEpisodes, ocInstance)
    storage.storeData(CONF.oc.filenames.series, ocSeries, ocInstance)
    storage.storeData(CONF.oc.filenames.episodesData, episodesData, ocInstance)
    storage.storeData(CONF.oc.filenames.seriesData, seriesData, ocInstance)
  }

  try {
    await initStoredData()

    logger.Info(`[Harvest] Import Opencast content from ${ocInstance} to ${CONF.es.host.domain}`)

    const episodes = await getAllPublishedEpisodes.start(
      ocEpisodes,
      forceUpdate,
      ocInstance,
      ocInstanceObj
    )

    ocEpisodes = await filter.filterAllowedLicensedEpisodes(episodes, CONF.filter.allowedLicences)
    ocSeries = await getSeriesIdsFromEpisodes.start(
      ocEpisodes,
      ocSeries,
      forceUpdate,
      ocInstance,
      ocInstanceObj
    )

    // console.log(seriesData)

    seriesData = await sorter.getSortedEpisodesPerSeriesIds(
      ocSeries,
      ocEpisodes,
      ocInstance,
      seriesData
    )

    episodesData = await sorter.getEpisodesDataObject(ocEpisodes, ocInstance, episodesData)
    storeData()

    await esAuth.initEsAuth()
    await esAxiosService.initEsAxios()
    console.log(seriesData)
    seriesData = await esFolders.createFolderForOcInstances(ocInstance, seriesData)
    storeData()
    console.log(seriesData)

    episodesData = await esChildren.createChildren(ocInstance, episodesData, seriesData)
    storeData()

    episodesData = await esMetadata.updateMetadata(ocInstance, episodesData)
    storeData()

    await esPermissions.updatePermissions(ocInstance, episodesData)
    storeData()

    logger.Info('[Harvest] Finished')
  } catch (error) {
    logger.Error(error.message)
  }
}

module.exports = {
  harvestOcInstance
}

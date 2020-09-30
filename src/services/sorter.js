'use strict'
const logger = require('node-file-logger')
const CONF = require('../config/config.json')

function getSortedEpisodesPerSeriesIds(series, episodes) {
  const uniqueSeriesIds = getUniqueSeriesIds(series)
  const seriesIdsObjects = createObjectsFromSeriesIds(uniqueSeriesIds)
  const sortedEpisodesPerSeriesId = sortEpisodesIdPerSeriesId(seriesIdsObjects, episodes)
  console.log(sortedEpisodesPerSeriesId)
}

function getUniqueSeriesIds(series) {
  const seriesIds = []
  for (let i = 0; i < series.length; i++) {
    seriesIds.push(series[i].id)
  }
  return [...new Set(seriesIds)]
  // return seriesIds.filter((x, i, a) => a.indexOf(x) === i)
}

function createObjectsFromSeriesIds(uniqueSeriesIds) {
  return uniqueSeriesIds.map(seriesId => {
    return { seriesId: seriesId }
  })
}

function sortEpisodesIdPerSeriesId(seriesIdsObjects, episodes) {
  const sortedEpisodes = seriesIdsObjects
  episodes.forEach(episode => {
    if (episode.dcIsPartOf) {
      console.log(episode.dcIsPartOf)
      const seriesIndex = sortedEpisodes.indexOf(episode.dcIsPartOf)
      console.log(seriesIndex)
    }
  })
}

module.exports = {
  getSortedEpisodesPerSeriesIds
}

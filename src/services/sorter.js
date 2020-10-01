'use strict'
const filter = require('./filter-episodes.js')

function getSortedEpisodesPerSeriesIds(series, episodes) {
  const uniqueSeriesIds = getUniqueSeriesIds(series)
  const seriesIdsObjects = createObjectsFromSeriesIds(uniqueSeriesIds)
  const filteredEpisodes = filter.filterForOpenLicensedEpisodes(episodes)
  const sortedEpisodesPerSeries = sortEpisodesPerSeriesId(
    seriesIdsObjects,
    filteredEpisodes
  )
  return sortedEpisodesPerSeries
}

function getUniqueSeriesIds(series) {
  const seriesIds = []
  for (let i = 0; i < series.length; i++) {
    seriesIds.push(series[i].id)
  }
  return [...new Set(seriesIds)]
}

function createObjectsFromSeriesIds(uniqueSeriesIds) {
  return uniqueSeriesIds.map((seriesId) => {
    return {
      id: seriesId,
      episodes: []
    }
  })
}

function sortEpisodesPerSeriesId(seriesIdsObjects, episodes) {
  const sortedEpisodes = seriesIdsObjects
  episodes.forEach((episode) => {
    if (episode.dcIsPartOf) {
      const episodeSeriesId = episode.dcIsPartOf
      const seriesIndex = sortedEpisodes.findIndex(
        (series) => series.id === episodeSeriesId
      )
      if (seriesIndex > 0) {
        sortedEpisodes[seriesIndex].episodes.push({ id: episode.id })
      }
    }
  })

  return sortedEpisodes
}

module.exports = {
  getSortedEpisodesPerSeriesIds
}

'use strict'

function getSortedEpisodesPerSeriesIds(series, filteredEpisodes, ocInstance) {
  const uniqueSeriesIds = getUniqueSeriesIds(series)
  const seriesIdsObjects = createObjectsFromSeriesIds(uniqueSeriesIds)
  const sortedEpisodesPerSeries = sortEpisodesPerSeriesId(seriesIdsObjects, filteredEpisodes)
  const sortedSeriesData = applySeriesData(sortedEpisodesPerSeries, series, ocInstance)
  return sortedSeriesData
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
      const seriesIndex = sortedEpisodes.findIndex((series) => series.id === episodeSeriesId)
      if (seriesIndex > 0) {
        sortedEpisodes[seriesIndex].episodes.push({ id: episode.id })
      }
    }
  })

  return sortedEpisodes
}

function applySeriesData(sortedEpisodesPerSeries, ocSeries, ocInstance) {
  return sortedEpisodesPerSeries.map((series) => {
    const currentOcSeries = ocSeries[ocSeries.findIndex((ocSeries) => ocSeries.id === series.id)]

    if (currentOcSeries) {
      if (currentOcSeries.dcTitle) series.title = currentOcSeries.dcTitle
      if (currentOcSeries.dcDescription) series.description = currentOcSeries.dcDescription
      if (currentOcSeries.dcPublisher) series.publisher = currentOcSeries.dcPublisher
      if (currentOcSeries.dcCreated) series.created = currentOcSeries.dcCreated
      if (currentOcSeries.keywords.length > 0) series.keywords = currentOcSeries.keywords
      if (currentOcSeries.mediaType) series.mediaType = currentOcSeries.mediaType
      if (currentOcSeries.modified) series.modified = currentOcSeries.modified
      series.from = ocInstance

      return series
    }
  })
}

function getUniqueEpisodesObjects(filteredEpisodes) {
  const uniqueEpisodeIds = getUniqueEpisodeIds(filteredEpisodes)
  const sortedEpisodes = createObjectsFromEpisodeIds(uniqueEpisodeIds)
  return sortedEpisodes
}

function getUniqueEpisodeIds(filteredEpisodes) {
  const episodeIds = []
  for (let i = 0; i < filteredEpisodes.length; i++) {
    episodeIds.push(filteredEpisodes[i].id)
  }
  return [...new Set(episodeIds)]
}

function createObjectsFromEpisodeIds(uniqueEpisodeIds) {
  return uniqueEpisodeIds.map((episodeId) => {
    return {
      id: episodeId
    }
  })
}

function applyEpisodeData(sortedEpisodes, ocEpisodes, ocInstance) {
  return sortedEpisodes.map((episode) => {
    const currentOcEpisode =
      ocEpisodes[ocEpisodes.findIndex((ocEpisode) => ocEpisode.id === episode.id)]

    if (currentOcEpisode) {
      if (currentOcEpisode.dcExtent) episode.extent = currentOcEpisode.dcExtent
      if (currentOcEpisode.dcTitle) episode.title = currentOcEpisode.dcTitle
      if (currentOcEpisode.dcDescription) episode.description = currentOcEpisode.dcDescription
      if (currentOcEpisode.dcCreator) episode.creator = currentOcEpisode.dcCreator
      if (currentOcEpisode.dcCreated) episode.created = currentOcEpisode.dcCreated
      if (currentOcEpisode.dcLicense) episode.license = currentOcEpisode.dcLicense
      if (currentOcEpisode.dcIsPartOf) episode.isPartOf = currentOcEpisode.dcIsPartOf
      if (currentOcEpisode.mediaType) episode.mediaType = currentOcEpisode.mediaType
      if (currentOcEpisode.keywords.length > 0) episode.keywords = currentOcEpisode.keywords
      if (currentOcEpisode.mediapackage.media.track.url) {
        episode.url = currentOcEpisode.mediapackage.media.track.url
      } else if (currentOcEpisode.mediapackage.media.track[0].url) {
        episode.url = currentOcEpisode.mediapackage.media.track[0].url
      }
      if (currentOcEpisode.modified) episode.modified = currentOcEpisode.modified
      episode.from = ocInstance

      return episode
    }
  })
}

module.exports = {
  getSortedEpisodesPerSeriesIds,
  getUniqueEpisodesObjects,
  applySeriesData,
  applyEpisodeData
}

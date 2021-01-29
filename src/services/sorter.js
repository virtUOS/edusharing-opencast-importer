'use strict'

function getSortedEpisodesPerSeriesIds(series, filteredEpisodes, ocInstance, seriesData) {
  if (!seriesData || seriesData.length <= series.length) {
    const uniqueSeriesIds = getUniqueSeriesIds(series)
    const seriesIdsObjects = createObjectsFromSeriesIds(uniqueSeriesIds)
    const sortedEpisodesPerSeries = sortEpisodesPerSeriesId(seriesIdsObjects, filteredEpisodes)
    const sortedSeriesData = applySeriesData(
      sortedEpisodesPerSeries,
      series,
      ocInstance,
      seriesData
    )
    return updateMetadata(sortedSeriesData)
  } else {
    return updateMetadata(seriesData)
  }
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

      if (seriesIndex >= 0) {
        sortedEpisodes[seriesIndex].episodes.push(episode.id.toString())
      }
    }
  })

  return sortedEpisodes.filter((series) => series.episodes.length > 0)
}

function applySeriesData(sortedEpisodesPerSeries, ocSeries, ocInstance, seriesData) {
  return sortedEpisodesPerSeries.map((series) => {
    const existingSeries = getExistingSeries(seriesData, series.id)
    const currentOcSeries = ocSeries[ocSeries.findIndex((ocSeries) => ocSeries.id === series.id)]

    if (currentOcSeries) {
      series.type = 'series'
      if (currentOcSeries.dcTitle) series.title = currentOcSeries.dcTitle
      if (currentOcSeries.dcDescription) series.description = currentOcSeries.dcDescription
      if (currentOcSeries.dcPublisher) series.publisher = currentOcSeries.dcPublisher
      if (currentOcSeries.dcCreated) series.created = currentOcSeries.dcCreated
      if (currentOcSeries.dcContributor) series.contributor = currentOcSeries.dcContributor
      if (currentOcSeries.dcLanguage) series.language = currentOcSeries.dcLanguage
      if (currentOcSeries.keywords.length > 0) series.keywords = currentOcSeries.keywords
      if (currentOcSeries.mediaType) series.mediaType = currentOcSeries.mediaType
      if (currentOcSeries.modified) series.modified = currentOcSeries.modified
      series.from = ocInstance
      series.lastUpdated = new Date()
      if (existingSeries) {
        if (existingSeries.nodeId) series.nodeId = existingSeries.nodeId
        if (existingSeries.parentId) series.parentId = existingSeries.parentId
      }

      return series
    }
  })

  function getExistingSeries(seriesData, seriesId) {
    if (seriesData) return seriesData.find((seriesData) => seriesData.id === seriesId)
  }
}

function updateMetadata(data) {
  if (!data[0].metadata) {
    const metadata = { metadata: {} }
    if (!metadata.metadata.firstCrawled) metadata.metadata.firstCrawled = new Date()
    data.unshift(metadata)
  }

  data[0].metadata.lastUpdated = new Date()

  return data
}

function getEpisodeDataObject(ocEpisodes, ocInstance, episodesData) {
  if (!episodesData || episodesData.length <= ocEpisodes.length) {
    const uniqueEpisodeIds = getUniqueEpisodeIds(ocEpisodes)
    const sortedEpisodes = createObjectsFromEpisodeIds(uniqueEpisodeIds)
    const episodes = applyEpisodeData(sortedEpisodes, ocEpisodes, ocInstance, episodesData)
    return updateMetadata(episodes)
  } else {
    return updateMetadata(episodesData)
  }
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

function applyEpisodeData(sortedEpisodes, ocEpisodes, ocInstance, episodesData) {
  return sortedEpisodes.map((episode) => {
    const existingEpisode = getExistingEpisode(episodesData, episode.id)
    const currentOcEpisode =
      ocEpisodes[ocEpisodes.findIndex((ocEpisode) => ocEpisode.id === episode.id)]

    if (currentOcEpisode) {
      episode.type = 'episode'
      if (currentOcEpisode.dcExtent) episode.extent = currentOcEpisode.dcExtent
      if (currentOcEpisode.dcTitle) episode.title = currentOcEpisode.dcTitle
      if (currentOcEpisode.dcDescription) episode.description = currentOcEpisode.dcDescription
      if (currentOcEpisode.dcCreator) episode.creator = currentOcEpisode.dcCreator
      if (currentOcEpisode.dcCreated) episode.created = currentOcEpisode.dcCreated
      if (currentOcEpisode.dcLicense) episode.license = currentOcEpisode.dcLicense
      if (currentOcEpisode.dcIsPartOf) episode.isPartOf = currentOcEpisode.dcIsPartOf
      if (currentOcEpisode.mediaType) episode.mediaType = currentOcEpisode.mediaType
      if (currentOcEpisode.keywords.length > 0) episode.keywords = currentOcEpisode.keywords
      episode.url = createEpisodeUrl(ocInstance, episode.id)
      if (currentOcEpisode.modified) episode.modified = currentOcEpisode.modified
      episode.from = ocInstance
      episode.lastUpdated = new Date()
      if (existingEpisode) {
        if (existingEpisode.nodeId) episode.nodeId = existingEpisode.nodeId
        if (existingEpisode.parentId) episode.parentId = existingEpisode.parentId
      }

      return episode
    }
  })

  function getExistingEpisode(episodesData, episodeId) {
    if (episodesData) return episodesData.find((episodesData) => episodesData.id === episodeId)
  }

  function createEpisodeUrl(ocInstance, episodeId) {
    return `https://${ocInstance}/play/${episodeId}`
  }
}

module.exports = {
  getSortedEpisodesPerSeriesIds,
  getEpisodesDataObject: getEpisodeDataObject,
  applySeriesData,
  applyEpisodeData
}

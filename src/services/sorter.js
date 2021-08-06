'use strict'

function getSortedEpisodesPerSeriesIds(series, filteredEpisodes, ocInstance, seriesData) {
  if (series.length === 0 && seriesData.length === 0) return updateMetadata([])
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
  const metadataIndex = getMetadataIndex(data)
  if (data.length === 0) {
    data.unshift({ type: 'metadata' })
  } else if (metadataIndex === -1) {
    data.unshift({ type: 'metadata' })
  } else if (metadataIndex > 0) {
    data = moveObjToFirstPosition(data, metadataIndex)
  }

  return setMetadataDates(data)
}

function getMetadataIndex(data) {
  return data.findIndex((object) => object.type === 'metadata')
}

function moveObjToFirstPosition(data, index) {
  const metadataObj = data[index]
  data.unshift(metadataObj)
  data.splice(index)
  return data
}

function setMetadataDates(data) {
  if (!data[0].firstCrawled) data[0].firstCrawled = new Date()
  if (!data[0].nodeId) data[0].nodeId = undefined
  if (!data[0].parentId) data[0].parentId = undefined
  data[0].lastUpdated = new Date()

  return data
}

function getEpisodesDataObject(ocEpisodes, ocInstance, episodesData) {
  const uniqueEpisodeIds = getUniqueEpisodeIds(ocEpisodes)
  const episodeObjs = createObjectsFromEpisodeIds(uniqueEpisodeIds)
  const episodes = applyEpisodeData(episodeObjs, ocEpisodes, ocInstance, episodesData)
  return updateMetadata(episodes)
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

function applyEpisodeData(episodeObjs, ocEpisodes, ocInstance, episodesData) {
  return episodeObjs.map((episode) => {
    const existingEpisode = getExistingEpisode(episodesData, episode.id)

    if (existingEpisode) {
      existingEpisode.lastUpdated = new Date()
      return existingEpisode
    } else {
      const newOcEpisode =
        ocEpisodes[ocEpisodes.findIndex((ocEpisode) => ocEpisode.id === episode.id)]

      if (newOcEpisode) {
        episode.type = 'episode'
        if (newOcEpisode.dcExtent) episode.extent = newOcEpisode.dcExtent
        if (newOcEpisode.dcTitle) episode.title = newOcEpisode.dcTitle
        if (newOcEpisode.dcDescription) episode.description = newOcEpisode.dcDescription
        if (newOcEpisode.dcCreator) episode.creator = newOcEpisode.dcCreator
        if (newOcEpisode.dcCreated) episode.created = newOcEpisode.dcCreated
        if (newOcEpisode.dcLicense) episode.license = newOcEpisode.dcLicense
        if (newOcEpisode.dcIsPartOf) episode.isPartOf = newOcEpisode.dcIsPartOf
        if (newOcEpisode.mediaType) episode.mediaType = newOcEpisode.mediaType
        if (newOcEpisode.keywords.length > 0) episode.keywords = newOcEpisode.keywords
        episode.url = createEpisodeUrl(ocInstance, episode.id)
        if (newOcEpisode.modified) episode.modified = newOcEpisode.modified
        episode.from = ocInstance
        episode.lastUpdated = new Date()
        episode.previewPlayer = getPreviewUrl('presenter/player+preview', newOcEpisode)
        episode.previewSearch = getPreviewUrl('presenter/search+preview', newOcEpisode)
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

  function getPreviewUrl(previewType, newOcEpisode) {
    const attachment = newOcEpisode.mediapackage.attachments.attachment
    for (let i = 0; i < attachment.length; i++) {
      if (attachment[i].type === previewType) {
        return attachment[i].url
      }
    }
  }
}

module.exports = {
  getSortedEpisodesPerSeriesIds,
  getEpisodesDataObject,
  applySeriesData,
  applyEpisodeData
}

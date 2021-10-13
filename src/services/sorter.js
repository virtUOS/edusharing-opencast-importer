'use strict'

function getSortedEpisodesPerSeriesIds(
  series,
  filteredEpisodes,
  ocInstance,
  seriesData,
  ocInstanceObj
) {
  if (series.length === 0 && seriesData.length === 0) return updateMetadata([])
  if (!seriesData || seriesData.length <= series.length) {
    const uniqueSeriesIds = getUniqueSeriesIds(series)
    const seriesIdsObjects = createObjectsFromSeriesIds(uniqueSeriesIds)
    const sortedEpisodesPerSeries = sortEpisodesPerSeriesId(seriesIdsObjects, filteredEpisodes)
    const sortedSeriesData = applySeriesData(
      sortedEpisodesPerSeries,
      series,
      ocInstance,
      seriesData,
      ocInstanceObj
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

function applySeriesData(sortedEpisodesPerSeries, ocSeries, ocInstance, seriesData, ocInstanceObj) {
  return sortedEpisodesPerSeries.map((series) => {
    const existingSeries = getExistingSeries(seriesData, series.id)
    const currentOcSeries = ocSeries[ocSeries.findIndex((ocSeries) => ocSeries.id === series.id)]

    if (currentOcSeries) {
      series.type = 'series'
      series.orgName = ocInstanceObj.orgName || ''
      series.orgUrl = ocInstanceObj.orgUrl || ''
      series.title = currentOcSeries.dcTitle || ''
      series.subject = currentOcSeries.dcSubject || ''
      series.creator = currentOcSeries.dcCreator || ''
      series.description = currentOcSeries.dcDescription || ''
      series.publisher = currentOcSeries.dcPublisher || ''
      series.rightsholder = currentOcSeries.dcRightsHolder || ''
      series.created = currentOcSeries.dcCreated || ''
      series.contributor = currentOcSeries.dcContributor || ''
      series.language = currentOcSeries.dcLanguage || ''
      series.keywords = currentOcSeries.keywords || []
      series.mediaType = currentOcSeries.mediaType || ''
      series.modified = currentOcSeries.modified || ''
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

function getEpisodesDataObject(ocEpisodes, ocInstance, episodesData, ocInstanceObj) {
  const uniqueEpisodeIds = getUniqueEpisodeIds(ocEpisodes)
  const episodeObjs = createObjectsFromEpisodeIds(uniqueEpisodeIds)
  const episodes = applyEpisodeData(
    episodeObjs,
    ocEpisodes,
    ocInstance,
    episodesData,
    ocInstanceObj
  )
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

function applyEpisodeData(episodeObjs, ocEpisodes, ocInstance, episodesData, ocInstanceObj) {
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
        episode.orgName = ocInstanceObj.orgName || ''
        episode.orgUrl = ocInstanceObj.orgUrl || ''
        episode.extent = newOcEpisode.dcExtent || 0
        episode.title = newOcEpisode.dcTitle || ''
        episode.description = newOcEpisode.dcDescription || ''
        episode.subject = newOcEpisode.dcSubject || ''
        episode.spatial = newOcEpisode.dcSpatial || ''
        episode.rghtsholder = newOcEpisode.dcRightsHolder || ''
        episode.creator = newOcEpisode.dcCreator || ''
        episode.creators = newOcEpisode.mediapackage.creators
          ? newOcEpisode.mediapackage.creators.creator
          : []
        episode.contributor = newOcEpisode.dcContributor || ''
        episode.contributors = newOcEpisode.mediapackage.contributors
          ? newOcEpisode.mediapackage.contributors.contributor
          : []
        episode.created = newOcEpisode.dcCreated || ''
        episode.license = getLicense(newOcEpisode.dcLicense) || ''
        episode.isPartOf = newOcEpisode.dcIsPartOf || ''
        episode.mediaType = newOcEpisode.mediaType || ''
        episode.language = newOcEpisode.dcLanguage || ''
        episode.keywords = newOcEpisode.keywords || []
        episode.url = createEpisodeUrl(ocInstance, episode.id)
        episode.modified = newOcEpisode.modified || ''
        episode.from = ocInstance
        episode.lastUpdated = new Date()
        episode.previewPlayer = getPreviewUrl('presenter/player+preview', newOcEpisode)
        episode.previewSearch = getPreviewUrl('presenter/search+preview', newOcEpisode)
        episode.filename = `${episode.id}-${episode.title
          .replace(/\s+/g, '-')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[(),!?=:;/]/g, '')
          .toLowerCase()
          .substring(0, 40)}`
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

  function getLicense(license) {
    const publicDomainStrings = ['pd', 'public domain', 'pdm']

    return publicDomainStrings.includes(license.toLowerCase()) ? 'PDM' : license
  }
}

module.exports = {
  getSortedEpisodesPerSeriesIds,
  getEpisodesDataObject,
  applySeriesData,
  applyEpisodeData
}

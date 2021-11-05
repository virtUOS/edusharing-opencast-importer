'use strict'

const logger = require('node-file-logger')

function filterAllowedLicensedEpisodes(episodes, allowedLicences, ocInstanceObj) {
  const episodesWithLicenseInfo = episodes.filter((episode) => episode.dcLicense)

  const episodesFiltered = episodesWithLicenseInfo.filter((episode) => {
    if ('blacklistedIds' in ocInstanceObj && ocInstanceObj['blacklistedIds'].includes(episode.id.toString())) {
      return false
    }
    for (let i = 0; i < allowedLicences.length; i++) {
      if (episode.dcLicense.replace(/-/g, ' ') === allowedLicences[i].replace(/-/g, ' ')) {
        return true
      }
    }
  })

  logger.Info('[Filter] Found ' + episodesFiltered.length + ' episodes with open licences')

  return episodesFiltered
}

module.exports = {
  filterAllowedLicensedEpisodes
}

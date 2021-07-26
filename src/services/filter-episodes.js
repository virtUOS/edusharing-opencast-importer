'use strict'

const logger = require('node-file-logger')

function filterAllowedLicensedEpisodes(episodes, allowedLicences) {
  const episodesWithLicenseInfo = episodes.filter((episode) => episode.dcLicense)

  const episodesFiltered = episodesWithLicenseInfo.filter((episode) => {
    for (let i = 0; i < allowedLicences.length; i++) {
      if (episode.dcLicense.replace(/-/g, ' ') === allowedLicences[i].replace(/-/g, ' ')) {
        return true
      }
    }
  })

  logger.Info('[Filter] Found ' + episodesFiltered.length + 1 + ' episodes with open licences')

  return episodesFiltered
}

module.exports = {
  filterAllowedLicensedEpisodes
}

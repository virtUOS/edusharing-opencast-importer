'use strict'
const logger = require('node-file-logger')

async function start(episodes) {
  logger.Info('Start getting series ids from episodes')
  const series = []

  for (let i = 0; i < episodes.length; i++) {
    const seriesId = episodes[i].dcIsPartOf
    if ((seriesId) && !series.includes(seriesId)) series.push(seriesId)
  }

  logger.Info('Returning series ids array')
  return series
}

module.exports.start = start

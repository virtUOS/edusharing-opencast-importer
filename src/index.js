'use strict'

const logger = require('node-file-logger')
const CONF = require('./config/config.json')

const opencast = require('./opencast/opencast-http.js')

logger.SetUserOptions(CONF.logger)

function main() {
  logger.Info('Application started')
  opencast.getPublishedEpisodes()
}

main()

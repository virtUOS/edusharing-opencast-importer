;(async () => {
  'use strict'
  require('dotenv').config()
  require('axios-debug-log')
  const logger = require('node-file-logger')
  const CONF = require('./config/config.js')

  const harvester = require('./workflows/harvestOcInstance')

  logger.SetUserOptions(CONF.logger)
  logger.Info('[App] Started')

  for (let i = 0; i < CONF.oc.instances.length; i++) {
    await harvester.harvestOcInstance(CONF.oc.instances[i], CONF.oc.forceUpdate)
  }
})()

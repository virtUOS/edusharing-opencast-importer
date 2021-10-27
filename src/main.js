;(async () => {
  'use strict'
  require('dotenv').config()
  require('axios-debug-log')
  const logger = require('node-file-logger')
  const CONF = require('./config/config.js')
  const isReachable = require('is-reachable')

  const harvester = require('./workflows/harvestOcInstance')

  logger.SetUserOptions(CONF.logger)
  logger.Info('[App] Started')

  for (let i = 0; i < CONF.oc.instances.length; i++) {
    try {
      if (!(await checkInstanceReachable(i))) {
        logger.Info(`[Harvest] OC Instance not reachable. Skipping ${CONF.oc.instances[i].domain}`)
        continue
      }
      await harvester.harvestOcInstance(CONF.oc.instances[i], CONF.oc.forceUpdate)
    } catch (error) {
      logger.Error(error.message)
    }
  }

  async function checkInstanceReachable(index) {
    return await isReachable(
      CONF.oc.instances[index].protocol + '://' + CONF.oc.instances[index].domain + '/search/'
    )
  }
})()

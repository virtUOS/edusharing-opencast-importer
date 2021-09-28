'use strict'
require('../models/errors')

const fs = require('fs')
const logger = require('node-file-logger')
const path = require('path')
const { NoSavedDataError } = require('../models/errors')

const writeOptions = {
  encode: 'utf8',
  flag: 'w+'
}

const localPath = path.resolve(__dirname) + '/../../data/'

function createFolder(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function loadData(filename, ocInstance) {
  createFolder(localPath + ocInstance)
  const filepath = localPath + ocInstance + '/' + filename
  try {
    const data = await fs.readFileSync(filepath, { encoding: 'utf8' })
    try {
      return JSON.parse(data)
    } catch (error) {}
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NoSavedDataError(filename)
    } else {
      logger.Error(error)
    }
  }
}

async function storeData(filename, data, ocInstance) {
  const filepath = localPath + ocInstance + '/' + filename
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), writeOptions)
  } catch (error) {
    logger.Error('[Storage] Error while saving data: ' + error)
  }
}

module.exports = {
  loadData,
  storeData
}

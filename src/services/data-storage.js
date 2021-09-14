'use strict'

const fs = require('fs')
const logger = require('node-file-logger')
const path = require('path')

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
    } catch (error) {
      logger.Error('[Storage] Error while parsing data (' + filename + ') : ' + error)
      // -> continue with new fetched data?
    }
  } catch (error) {
    error.code === 'ENOENT'
      ? logger.Info('[Storage] No saved data found (' + filename + ')')
      : logger.Error(error)
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

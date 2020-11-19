'use strict'

const fs = require('fs/promises')
const fss = require('fs')
const logger = require('node-file-logger')
const path = require('path')

const writeOptions = {
  encode: 'utf8',
  flag: 'w+'
}

const localPath = path.resolve(__dirname) + '/../../data/'

function createFolder(dir) {
  if (!fss.existsSync(dir)) {
    fss.mkdirSync(dir)
  }
}

async function loadData(filename, ocInstance) {
  createFolder(localPath + ocInstance)
  const filepath = localPath + ocInstance + '/' + filename
  /*   return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (error, data) => {
      error ? reject(logger.Error(error)) : resolve(JSON.parse(data))
    })
  }) */
  try {
    const data = await fs.readFile(filepath, { encoding: 'utf8' })
    return JSON.parse(data)
  } catch (error) {
    error.code === 'ENOENT'
      ? logger.Info('[Storage] No saved data found (' + filename + ')')
      : logger.Error(error)
  }
}

async function storeData(filename, data, ocInstance) {
  const filepath = localPath + ocInstance + '/' + filename
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, JSON.stringify(data), writeOptions, (error, data) => {
      error ? reject(logger.Error(error)) : resolve(data)
    })
  })
}

module.exports = {
  loadData,
  storeData
}

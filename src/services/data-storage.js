'use strict'

const fs = require('fs/promises')
const logger = require('node-file-logger')
const path = require('path')

const writeOptions = {
  encode: 'utf8',
  flag: 'w+'
}

const localPath = path.resolve(__dirname) + '/../../data/'

async function loadData(filename) {
  const filepath = localPath + filename
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (error, data) => {
      error ? reject(logger.Error(error)) : resolve(JSON.parse(data))
    })
  })
}

async function storeData(filename, data) {
  const filepath = localPath + filename
  return new Promise((resolve, reject) => {
    fs.writeFile(
      filepath,
      JSON.stringify(data),
      writeOptions,
      (error, data) => {
        error ? reject(logger.Error(error)) : resolve(data)
      }
    )
  })
}

module.exports = {
  loadData,
  storeData
}

'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default
const { ESAuthError } = require('../models/errors')

let authObj = { type: '', token_access: '' }

async function initEsAuth() {
  if (process.env.ES_CLIENT_ID && process.env.ES_CLIENT_SECRET) {
    await createBearerAuthToken()
  } else if (process.env.ES_USER && process.env.ES_PASSWORD) {
    await createBasicAuthToken()
  } else {
    logger.Error(
      '[Auth] No Edu-Sharing credentials found. ' +
        'Please add ES_USER and ES_PASSWORD to .env file.'
    )
  }
}

async function createBearerAuthToken() {
  authObj.type = 'Bearer'

  const body = getBodyOauth(
    process.env.ES_CLIENT_ID,
    process.env.ES_CLIENT_SECRET,
    process.env.ES_USER,
    process.env.ES_PASSWORD
  )
  const url = getUrlOauth()

  return await sendPostRequest(url, body)
}

async function sendPostRequest(url, body) {
  return await axios
    .post(url, body)
    .then((response) => {
      if (response.status === 200) return handlePostRequestOauth(response)
    })
    .catch((error) => {
      logger.Error(
        '[ES AUTH] Could not create bearer token (' +
          error.message +
          ') Retrying with basic token...'
      )
      return createBasicAuthToken()
    })
}

function getUrlOauth() {
  return CONF.es.host.url + CONF.es.routes.oauth
}

function getBodyOauth(esClientId, esClientSecret, esUser, esPassword) {
  return (
    'grant_type=password&' +
    'client_id=' +
    esClientId +
    '&client_secret=' +
    esClientSecret +
    '&username=' +
    esUser +
    '&password=' +
    esPassword
  )
}

function handlePostRequestOauth(res) {
  if (res.data.access_token) authObj.token_access = res.data.access_token
  if (res.data.refresh_token) authObj.token_refresh = res.data.refresh_token
  if (res.data.expires_in) authObj.token_expires_in = res.data.expires_in
  authObj.token_created = new Date()
}

async function createBasicAuthToken() {
  try {
    authObj.type = 'Basic'
    authObj.token_access = getBasicAuthBase64String(process.env.ES_USER, process.env.ES_PASSWORD)
    await checkEsAuthExpiration(authObj)
  } catch (error) {
    throw new ESAuthError(error.message)
  }
}

async function checkEsAuthExpiration() {
  const url = CONF.es.host.url + CONF.es.routes.validation

  const headers = {
    Accept: 'application/json',
    'Accept-Language': 'de-DE,en;q=0.7,en-US;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
    locale: 'de_DE',
    Authorization: authObj.type + ' ' + authObj.token_access,
    Connection: 'keep-alive',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache'
  }

  return await axios
    .get(url, { headers })
    .then(async (response) => {
      const statusCode = response.data.statusCode
      if (statusCode === 'OK') {
        return true
      } else if (statusCode === 'INVALID_CREDENTIALS' && authObj.type === 'Basic') {
        throw new ESAuthError('Invalid username or password')
      } else if (statusCode === 'INVALID_CREDENTIALS' && authObj.type === 'Bearer') {
        await refreshOAuth()
      } else {
        throw new ESAuthError(response.statusCode)
      }
    })
    .catch((error) => {
      throw new ESAuthError(error.message)
    })
}

function getBasicAuthBase64String(esUser, esPassword) {
  return Buffer.from(esUser + ':' + esPassword).toString('base64')
}

function getBodyOauthRefresh() {
  return (
    'grant_type=refresh_token&' +
    'client_id=' +
    process.env.ES_CLIENT_ID +
    '&client_secret=' +
    process.env.ES_CLIENT_SECRET +
    '&refresh_token=' +
    authObj.token_refresh
  )
}

async function refreshOAuth() {
  const url = getUrlOauth()
  const body = getBodyOauthRefresh()

  return await sendPostRequest(url, body)
}

module.exports = {
  initEsAuth,
  checkEsAuthExpiration,
  authObj
}

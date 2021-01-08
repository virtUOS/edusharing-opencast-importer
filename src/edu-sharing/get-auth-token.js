'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default

async function getEsAuth() {
  let authObj = { type: '', token_access: '' }

  if (process.env.ES_CLIENT_ID && process.env.ES_CLIENT_SECRET) {
    authObj = await createBearerAuthToken(authObj)
  } else if (process.env.ES_USER && process.env.ES_PASSWORD) {
    authObj = createBasicAuthToken(authObj)
  } else {
    logger.Error(
      '[Auth] No Edu-Sharing credentials found. ' +
        'Please add ES_USER and ES_PASSWORD to .env file.'
    )
  }

  return authObj
}

async function createBearerAuthToken(authObj) {
  authObj.type = 'Bearer'

  const body = getBodyOauth(
    process.env.ES_CLIENT_ID,
    process.env.ES_CLIENT_SECRET,
    process.env.ES_USER,
    process.env.ES_PASSWORD
  )
  const url = getUrlOauth()

  return await sendPostRequest(url, body, authObj)
}

async function sendPostRequest(url, body, authObj) {
  return await axios
    .post(url, body)
    .then((response) => {
      if (response.status === 200) return handlePostRequestOauth(response, authObj)
    })
    .catch((error) => {
      if (error.code === 'ECONNREFUSED') return createBasicAuthToken(authObj)
      logger.Error('[Auth] ' + error)
    })
}

function getUrlOauth() {
  return CONF.es.protocol + '://' + CONF.es.domain + CONF.es.routes.oauth
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

function handlePostRequestOauth(res, authObj) {
  if (res.data.access_token) authObj.token_access = res.data.access_token
  if (res.data.refresh_token) authObj.token_refresh = res.data.refresh_token
  if (res.data.expires_in) authObj.token_expires_in = res.data.expires_in
  authObj.token_created = new Date()

  return authObj
}

function createBasicAuthToken(authObj) {
  try {
    authObj.type = 'Basic'
    authObj.token_access = getBasicAuthBase64String(process.env.ES_USER, process.env.ES_PASSWORD)
  } catch (error) {
    logger.Error('[Auth] ' + error)
  }
  return authObj
}

function getBasicAuthBase64String(esUser, esPassword) {
  return Buffer.from(esUser + ':' + esPassword).toString('base64')
}

module.exports = {
  getEsAuth
}

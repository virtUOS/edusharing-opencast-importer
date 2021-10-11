'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const { esAxios } = require('../services/es-axios')
const pLimit = require('p-limit')
const { ESError, ESPostError } = require('../models/errors')

async function updateMetadata(ocInstance, episodesData) {
  logger.Info('[ES API] Update metadata per episode for ' + ocInstance)
  return await returnReqsAsPromiseArray(episodesData)
    .then(async (res) => {
      return episodesData
    })
    .catch((error) => {
      if (error instanceof ESError) {
        throw error
      } else throw new ESError('[ES API] Error while updating metadata: ' + error.message)
    })

  async function returnReqsAsPromiseArray(episodesData) {
    const limit = pLimit(CONF.es.settings.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (!episodesData[i].nodeId) continue

      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlUpdateMetadata(episodesData[i]),
            getBodyUpdateMetadata(episodesData[i]),
            getHeadersUpdateMetadata(),
            i
          ).catch((error) => {
            if (error instanceof ESPostError) {
              throw error
            } else throw new ESError('[ES API] Error while updating metadata: ' + error.message)
          })
        )
      )
    }

    return Promise.all(requests)
  }

  async function sendPostRequest(url, body, headers, index) {
    return await esAxios
      .post(url, body, headers)
      .then((response) => {
        if (response.status === 200) {
          return handleResponse(index)
        }
      })
      .catch((error) => {
        throw new ESPostError(error.message, error.code)
      })
  }

  function getUrlUpdateMetadata(episode) {
    return (
      CONF.es.host.url +
      CONF.es.routes.api +
      CONF.es.routes.baseFolder +
      '/' +
      episode.nodeId +
      '/metadata?versionComment=METADATA_UPDATE'
    )
  }

  function getBodyUpdateMetadata(episode) {
    const licenseUpperUnderscore = episode.license.replace(/\s+/g, '-').toUpperCase()

    const filename = `${episode.id}-${episode.title
      .replace(/\s+/g, '-')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[(),!?=:;/]/g, '')
      .toLowerCase()
      .substring(0, 40)}`

    return JSON.stringify({
      'cm:name': [filename],
      'ccm:original': [episode.nodeId],
      'sys:node-uuid': [episode.nodeId],
      'cclom:title': [episode.title],
      'ccm:create_version': ['true'],
      'cm:modifiedISO8601': [episode.modified],
      'ccm:wwwurl': [episode.url],
      'cm:creator': [episode.creator],
      'cm:autoVersion': ['false'],
      'virtual:primaryparent_nodeid': [episode.parentId],
      'cm:createdISO8601': [episode.created],
      'cclom:general_description': [episode.description],
      'cm:edu_forcemetadataset': ['false'],
      'cm:modifier': ['opencast importer'],
      'cm:autoVersionOnUpdateProps': ['false'],
      'cclom:location': ['ccrep://repo/' + episode.nodeId],
      'ccm:author_freetext': [
        Array.isArray(episode.creators) ? episode.creators.join('; ') : episode.creators
      ],
      'ccm:lifecyclecontributer_authorFN': [episode.creator],
      'ccm:lifecyclecontributer_authorVCARD_ORG': [episode.orgName],
      'ccm:lifecyclecontributer_authorVCARD_URL': [episode.orgUrl],
      'ccm:metadatacontributer_creatorFN': ['opencast importer'],
      'ccm:metadatacontributer_creatorVCARD_ORG': [episode.orgName],
      'ccm:metadatacontributer_creatorVCARD_URL': [episode.orgUrl],
      'ccm:questionsallowed': ['true'],
      'cm:automaticUpdate': ['true'],
      'cm:initialVersion': ['false'],
      'ccm:commonlicense_key': [licenseUpperUnderscore],
      'cm:created': [Date.parse(episode.created)],
      'cm:created_LONG': [Date.parse(episode.created)],
      'cm:modified': [Date.parse(episode.modified)],
      'cm:modified_LONG': [Date.parse(episode.modified)],
      'ccm:educationallearningresourcetype_DISPLAYNAME': ['Vorlesungsaufzeichnung'],
      'ccm:version_comment': ['automated import'],
      // twillo specific metadata
      'ccm:inhaltstyp': ['Lektion'],
      'ccm:educationallearningresourcetype': ['Video'],
      'cclom:interactivitytype': ['Vorlesung'],
      'cclom:typicallearningtime': [episode.extent * 1000]

      // 'ccm:lifecyclecontributer_authorVCARD_TITLE': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_SURNAME': ['Nachname'],
      // 'ccm:lifecyclecontributer_authorVCARD_COUNTRY': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_REGION': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_STREET': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_PLZ': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_GIVENNAME': ['Vorname'],
      // 'ccm:lifecyclecontributer_authorVCARD_TEL': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_CITY': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_EMAIL': [''],

      // 'ccm:metadatacontributer_creatorVCARD_REGION': [''],
      // 'ccm:metadatacontributer_creatorVCARD_PLZ': [''],
      // 'ccm:metadatacontributer_creatorVCARD_GIVENNAME': ['open'],
      // 'ccm:metadatacontributer_creatorVCARD_SURNAME': ['cast'],
      // 'ccm:metadatacontributer_creatorVCARD_COUNTRY': [''],
      // 'ccm:metadatacontributer_creatorVCARD_TEL': [''],
      // 'ccm:metadatacontributer_creatorVCARD_STREET': [''],
      // 'ccm:metadatacontributer_creatorVCARD_CITY': [''],
      // 'ccm:metadatacontributer_creatorVCARD_EMAIL': [''],
      // 'ccm:metadatacontributer_creatorVCARD_TITLE': [''],
    }).toString()
  }

  function getHeadersUpdateMetadata() {
    return {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'de-DE,en;q=0.7,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        locale: 'de_DE',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache'
      }
    }
  }

  async function handleResponse(index) {
    episodesData[index].lastUpdated = new Date()
  }
}

module.exports = {
  updateMetadata
}

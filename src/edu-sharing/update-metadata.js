'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const MAPPING = require('../config/mapping.js')
const { esAxios } = require('../services/es-axios')
const pLimit = require('p-limit')
const { ESError, ESPostError } = require('../models/errors')
const parseFullName = require('parse-full-name').parseFullName
const vCardsJS = require('vcards-js')

async function updateMetadata(ocInstance, episodesData) {
  logger.Info('[ES API] Update metadata per episode for ' + ocInstance)
  return await returnReqsAsPromiseArray(episodesData)
    .then(async res => {
      return episodesData
    })
    .catch(error => {
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
          ).catch(error => {
            if (error instanceof ESPostError) {
              throw error
            } else throw new ESError('[ES API] Error while updating metadata: ' + error.message)
          })
        )
      )
    }

    return Promise.allSettled(requests)
  }

  async function sendPostRequest(url, body, headers, index) {
    return await esAxios
      .post(url, body, headers)
      .then(response => {
        if (response.status === 200) {
          return handleResponse(index)
        }
      })
      .catch(error => {
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
    const licenseUpperUnderscore = episode.license
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .toUpperCase()
    const authorName = parseFullName(episode.creator)

    return JSON.stringify({
      'cm:name': [episode.filename],
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
      'cclom:general_language': [episode.language],
      'cm:edu_forcemetadataset': ['false'],
      'cm:modifier': ['opencast importer'],
      'cm:autoVersionOnUpdateProps': ['false'],
      'cclom:location': ['ccrep://repo/' + episode.nodeId],
      'ccm:author_freetext': [
        Array.isArray(episode.creators) ? episode.creators.join('; ') : episode.creators
      ],
      'ccm:lifecyclecontributer_author': [
        parseVCard({
          title: authorName.title,
          firstName: authorName.first,
          middleName: authorName.middle,
          lastName: authorName.last,
          formattedName: authorName.formattedName
        })
      ],
      'ccm:lifecyclecontributer_publisher': [
        parseVCard({
          organization: episode.organization,
          url: episode.orgUrl
        })
      ],
      'ccm:metadatacontributer_creator': [
        parseVCard({
          firstName: 'Opencast',
          url: 'https://github.com/virtUOS/edusharing-opencast-importer'
        })
      ],
      'ccm:questionsallowed': ['true'],
      'cm:automaticUpdate': ['true'],
      'cm:initialVersion': ['false'],
      'ccm:commonlicense_key': [licenseUpperUnderscore],
      'cm:created': [Date.parse(episode.created)],
      'cm:created_LONG': [Date.parse(episode.created)],
      'cm:modified': [Date.parse(episode.modified)],
      'cm:modified_LONG': [Date.parse(episode.modified)],
      'ccm:version_comment': ['Automatischer Import von Opencast'],
      'cclom:general_keyword': ['Vorlesungsaufzeichnung', 'Opencast'],
      // twillo specific metadata
      'ccm:taxonid': [mapSubject(episode.subject)],
      'ccm:inhaltstyp': ['Lektion'],
      'ccm:educationallearningresourcetype': ['https://w3id.org/kim/hcrt/video'],
      'cclom:interactivitytype': ['Vorlesung'],
      'ccm:university': [episode.orgRor],
      'cclom:typicallearningtime': [episode.extent]
    }).toString()
  }
  
  function mapSubject(ocSubject) {
    if (ocSubject in MAPPING.subjects) {
      return MAPPING.subjects[ocSubject]
    }
    return ''
  }

  function parseVCard(obj) {
    const vCard = vCardsJS()

    vCard.title = obj.title
    vCard.firstName = obj.firstName
    vCard.middleName = obj.middleName
    vCard.lastName = obj.lastName
    vCard.formattedName = obj.formattedName
    vCard.organization = obj.organization
    vCard.url = obj.url
    vCard.version = '3.0'

    return vCard.getFormattedString()
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

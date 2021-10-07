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
  // {"ccm:commonlicense_key":["PDM"],"ccm:questionsallowed":[true],"ccm:author_freetext":[""],"ccm:lifecyclecontributer_author":[null]}
  function getBodyUpdateMetadata(episode) {
    const licenseLowerDash = episode.license.replace(/\s+/g, '-').toLowerCase()
    const licenseUpperUnderscore = episode.license
      .replace(/\s+/g, '_')
      .replace(/_/g, '_')
      .toUpperCase()

    return JSON.stringify({
      'ccm:original': [episode.nodeId],
      'virtual:licenseicon': [
        `http://localhost/edu-sharing/ccimages/licenses/${licenseLowerDash}.svg`
      ],
      'sys:node-uuid': [episode.nodeId],
      'virtual:licenseurl': [
        `https://creativecommons.org/licenses/${licenseLowerDash}/4.0/deed.de`
      ],
      'cclom:title': [episode.title],
      'ccm:create_version': ['true'],
      'cm:modifiedISO8601': [episode.modified],
      'ccm:wwwurl': [episode.url],
      'cm:creator': [episode.creator],
      'cm:autoVersion': ['false'],
      'virtual:primaryparent_nodeid': [episode.parentId],
      'cm:createdISO8601': [episode.created],
      'ccm:ph_action': ['PERMISSION_ADD'],
      'cclom:general_description': [episode.description],
      'cm:edu_forcemetadataset': ['false'],
      'cm:modifier': ['opencast'],
      'cm:autoVersionOnUpdateProps': ['false'],
      'cclom:location': ['ccrep://repo/' + episode.nodeId],
      'ccm:lifecyclecontributer_authorFN': [episode.creator],
      'ccm:metadatacontributer_creatorFN': ['open cast'],
      'ccm:questionsallowed': ['true'],
      'cm:automaticUpdate': ['true'],
      'cm:initialVersion': ['false'],
      'ccm:commonlicense_key': [licenseUpperUnderscore]
      // 'ccm:lifecyclecontributer_authorVCARD_ORG': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_TITLE': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_SURNAME': ['Nachname'],
      // 'ccm:lifecyclecontributer_authorVCARD_COUNTRY': [''],
      // 'ccm:lifecyclecontributer_author': ['BEGIN:VCARD\nN:Nachname;Vorname\nFN:Vorname Nachname\nVERSION:3.0\nEND:VCARD'],
      // 'ccm:lifecyclecontributer_authorVCARD_REGION': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_STREET': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_PLZ': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_GIVENNAME': ['Vorname'],
      // 'ccm:lifecyclecontributer_authorVCARD_TEL': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_CITY': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_EMAIL': [''],
      // 'ccm:metadatacontributer_creatorVCARD_URL': [''],
      // 'ccm:metadatacontributer_creatorVCARD_REGION': [''],
      // 'ccm:metadatacontributer_creatorVCARD_PLZ': [''],
      // 'ccm:metadatacontributer_creatorVCARD_GIVENNAME': ['open'],
      // 'ccm:metadatacontributer_creatorVCARD_COUNTRY': [''],
      // 'ccm:metadatacontributer_creator': ['BEGIN:VCARD\nVERSION:3.0\nN:cast;open\nFN:open cast\nORG:\nURL:\nTITLE:\nTEL;TYPE=WORK,VOICE:\nADR;TYPE=intl,postal,parcel,work:;;;;;;\nEMAIL;TYPE=PREF,INTERNET:\nEND:VCARD\n'],
      // 'ccm:metadatacontributer_creatorVCARD_TEL': [''],
      // 'ccm:metadatacontributer_creatorVCARD_STREET': [''],
      // 'ccm:metadatacontributer_creatorVCARD_CITY': [''],
      // 'ccm:metadatacontributer_creatorVCARD_EMAIL': [''],
      // 'ccm:metadatacontributer_creatorVCARD_TITLE': [''],
      // 'cm:created': ['1605880817805'],
      // 'cm:modified': ['1605881127676'],
      // 'ccm:metadatacontributer_creatorVCARD_ORG': [''],
      // 'cclom:version': ['1.3'],
      // 'ccm:lifecyclecontributer_authorVCARD_URL': [''],
      // 'ccm:linktype': ['USER_GENERATED'],
      // 'ccm:version_comment': ['LICENSE_UPDATE'],
      // 'ccm:educationallearningresourcetype': ['exercise'],
      // 'ccm:author_freetext': [''],
      // 'cm:edu_metadataset': ['mds'],
      // 'cm:versionLabel': ['1.3'],
      // 'cm:versionable': ['true'],
      // 'ccm:commonlicense_cc_version': ['4.0'],
      // 'cm:created_LONG': ['1605880817805'],
      // 'ccm:educationallearningresourcetype_DISPLAYNAME': ['Vorlesungsaufzeichnung'],
      // 'ccm:educontextname': ['default'],
      // 'cm:modified_LONG': ['1605881127676'],
      // 'cm:name': ['NASA_new_High_Dynamic_Range_Camera_Records_Rocket_Test.webm'],
      // 'ccm:metadatacontributer_creatorVCARD_SURNAME': ['cast'],
      // 'cclom:general_keyword': ['Katzen', 'Hunde', 'Schlangen'],
      // 'sys:store-protocol': ['workspace'],
      // 'sys:store-identifier': ['SpacesStore'],
      // 'sys:node-dbid': ['836'],
      // 'virtual:permalink': ['http://localhost/edu-sharing/components/render/3ef96b84-84cb-46c9-ae0c-a6b10e27b5f2/1.3'],
      // 'virtual:commentcount': ['0'],
      // 'virtual:usagecount': ['0'],
      // 'virtual:childobjectcount': ['0'],
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

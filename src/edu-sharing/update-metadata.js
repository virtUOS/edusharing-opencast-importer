'use strict'

const logger = require('node-file-logger')
const CONF = require('../config/config.js')
const axios = require('axios').default
const pLimit = require('p-limit')

async function updateMetadata(ocInstance, episodesData, authObj) {
  logger.Info('[ES API] Update metadata per episode for ' + ocInstance)

  return await returnReqsAsPromiseArray(authObj, episodesData)
    .then(async (res) => {
      return episodesData
    })
    .catch((error) => logger.Error(error))

  async function returnReqsAsPromiseArray(authObj, episodesData) {
    const limit = pLimit(CONF.es.maxPendingPromises)

    const requests = []
    for (let i = 0; i < episodesData.length; i++) {
      if (!episodesData[i].nodeId) continue
      if (!modifiedSinceLastUpdate(episodesData[i])) continue

      requests.push(
        limit(() =>
          sendPostRequest(
            getUrlUpdateMetadata(episodesData[i]),
            getBodyUpdateMetadata(episodesData[i]),
            getHeadersUpdateMetadata(authObj),
            i
          ).catch((error) => {
            logger.Error(error)
          })
        )
      )
    }

    return Promise.all(requests)
  }

  function modifiedSinceLastUpdate(episode) {
    if (episode.lastUpdated < episode.modified) return true
    if (episode.lastUpdated < episode.created) return true
    return false
  }

  async function sendPostRequest(url, body, headers, index) {
    return await axios
      .post(url, body, headers)
      .then((response) => {
        if (response.status === 200) {
          return handleResponse(index)
        }
      })
      .catch((error) => {
        logger.Error('[ES API] ' + error)
      })
  }

  function getUrlUpdateMetadata(episode) {
    return (
      CONF.es.protocol +
      '://' +
      CONF.es.domain +
      CONF.es.routes.api +
      CONF.es.routes.baseFolder +
      '/' +
      episode.nodeId +
      '/metadata?versionComment=METADATA_UPDATE'
    )
  }

  function getBodyUpdateMetadata(episode) {
    const licenseLowerDash = episode.license.replace(/\s+/g, '-').toLowerCase()
    const licenseUpperUnderscore = episode.license
      .replace(/\s+/g, '_')
      .replace(/_/g, '_')
      .toUpperCase()

    return JSON.stringify({
      // 'ccm:lifecyclecontributer_authorVCARD_ORG': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_TITLE': [''],
      'ccm:original': [episode.nodeId],
      // 'cm:created': ['1605880817805'],
      // 'virtual:commentcount': ['0'],
      // 'ccm:metadatacontributer_creatorVCARD_ORG': [''],
      // 'cclom:version': ['1.3'],
      'virtual:licenseicon': [
        `http://localhost/edu-sharing/ccimages/licenses/${licenseLowerDash}.svg`
      ],
      // 'virtual:usagecount': ['0'],
      'sys:node-uuid': [episode.nodeId],
      // >> 'ccm:lifecyclecontributer_authorVCARD_SURNAME': ['Nachname'],
      // 'ccm:lifecyclecontributer_authorVCARD_URL': [''],
      // 'virtual:childobjectcount': ['0'],
      'virtual:licenseurl': [
        `https://creativecommons.org/licenses/${licenseLowerDash}/4.0/deed.de`
      ],
      'cclom:title': [episode.title],
      // 'ccm:linktype': ['USER_GENERATED'],
      // 'ccm:lifecyclecontributer_authorVCARD_COUNTRY': [''],
      // 'ccm:lifecyclecontributer_author': ['BEGIN:VCARD\nN:Nachname;Vorname\nFN:Vorname Nachname\nVERSION:3.0\nEND:VCARD'],
      // 'ccm:lifecyclecontributer_authorVCARD_REGION': [''],
      // 'sys:store-protocol': ['workspace'],
      // 'ccm:lifecyclecontributer_authorVCARD_STREET': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_PLZ': [''],
      // 'sys:store-identifier': ['SpacesStore'],
      // >> 'ccm:version_comment': ['LICENSE_UPDATE'],
      // 'ccm:metadatacontributer_creatorVCARD_URL': [''],
      // >> 'ccm:educationallearningresourcetype': ['exercise'],
      'ccm:create_version': ['true'],
      'cm:modifiedISO8601': [episode.modified],
      // 'ccm:author_freetext': [''],
      // 'ccm:metadatacontributer_creatorVCARD_REGION': [''],
      // 'sys:node-dbid': ['836'],
      'ccm:wwwurl': [episode.url],
      // 'cm:edu_metadataset': ['mds'],
      // 'ccm:metadatacontributer_creatorVCARD_PLZ': [''],
      'cm:creator': [episode.creator],
      'cm:autoVersion': ['false'],
      // 'virtual:permalink': ['http://localhost/edu-sharing/components/render/3ef96b84-84cb-46c9-ae0c-a6b10e27b5f2/1.3'],
      // 'ccm:metadatacontributer_creatorVCARD_GIVENNAME': ['open'],
      // 'cm:versionLabel': ['1.3'],
      // 'cm:versionable': ['true'],
      // >> 'ccm:lifecyclecontributer_authorVCARD_GIVENNAME': ['Vorname'],
      // 'ccm:metadatacontributer_creatorVCARD_COUNTRY': [''],
      // >> 'ccm:commonlicense_cc_version': ['4.0'],
      // 'cm:created_LONG': ['1605880817805'],
      // 'ccm:lifecyclecontributer_authorVCARD_TEL': [''],
      'virtual:primaryparent_nodeid': [episode.parentId],
      // 'ccm:metadatacontributer_creator': ['BEGIN:VCARD\nVERSION:3.0\nN:cast;open\nFN:open cast\nORG:\nURL:\nTITLE:\nTEL;TYPE=WORK,VOICE:\nADR;TYPE=intl,postal,parcel,work:;;;;;;\nEMAIL;TYPE=PREF,INTERNET:\nEND:VCARD\n'],
      // 'ccm:metadatacontributer_creatorVCARD_TEL': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_CITY': [''],
      // 'ccm:metadatacontributer_creatorVCARD_STREET': [''],
      'cm:createdISO8601': [episode.created],
      'ccm:ph_action': ['PERMISSION_ADD'],
      'cclom:general_description': [episode.description],
      // 'cm:modified': ['1605881127676'],
      'cm:edu_forcemetadataset': ['false'],
      // 'ccm:metadatacontributer_creatorVCARD_CITY': [''],
      'cm:modifier': ['opencast'],
      // 'ccm:educationallearningresourcetype_DISPLAYNAME': ['Vorlesungsaufzeichnung'],
      'cm:autoVersionOnUpdateProps': ['false'],
      'cclom:location': ['ccrep://repo/' + episode.nodeId],
      // 'ccm:educontextname': ['default'],
      'ccm:lifecyclecontributer_authorFN': [episode.creator],
      // 'ccm:metadatacontributer_creatorVCARD_EMAIL': [''],
      // 'ccm:lifecyclecontributer_authorVCARD_EMAIL': [''],
      'ccm:metadatacontributer_creatorFN': ['open cast'],
      // 'cm:modified_LONG': ['1605881127676'],
      // 'ccm:metadatacontributer_creatorVCARD_TITLE': [''],
      'ccm:questionsallowed': ['true'],
      'cm:automaticUpdate': ['true'],
      // 'cm:name': ['NASA_new_High_Dynamic_Range_Camera_Records_Rocket_Test.webm'],
      'cm:initialVersion': ['false'],
      // 'ccm:metadatacontributer_creatorVCARD_SURNAME': ['cast'],
      // 'cclom:general_keyword': ['Katzen', 'Hunde', 'Schlangen'],
      'ccm:commonlicense_key': [licenseUpperUnderscore]
    }).toString()
  }

  function getHeadersUpdateMetadata(authObj) {
    return {
      headers: {
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
    }
  }

  async function handleResponse(index) {
    episodesData[index].lastUpdated = new Date()
  }
}

module.exports = {
  updateMetadata
}

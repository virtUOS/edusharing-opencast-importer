module.exports = {
  es: {
    protocol: 'http',
    domain: 'localhost',
    routes: {
      api: '/edu-sharing/rest/node/v1/nodes',
      oauth: '/edu-sharing/oauth2/token',
      baseFolder: '/-home-'
    },
    maxPendingPromises: 1
  },
  oc: {
    protocol: 'https',
    domain: 'video4.virtuos.uni-osnabrueck.de',
    domainDev: 'develop.opencast.org',
    maxPendingPromises: 2,
    requestOffset: 5,
    routes: {
      getAllEpisodes: '/search/episode.json',
      getSeriesById: '/search/series.json'
    },
    develop: {
      useDevDomain: true
    },
    filenames: {
      episodes: 'ocEpisodes.json',
      series: 'ocSeries.json',
      episodesData: 'episodesData.json',
      seriesData: 'seriesData.json'
    }
  },
  logger: {
    folderPath: './logs/',
    dateBasedFileNaming: true,
    fileNamePrefix: 'es-oc-importer_',
    fileNameExtension: '.log',
    timeZone: 'Europe/Berlin',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    logLevel: 'debug',
    onlyFileLogging: false
  },
  filter: {
    allowedLicences: ['CC0', 'CC-BY', 'CC-BY-SA', 'PD']
  }
}

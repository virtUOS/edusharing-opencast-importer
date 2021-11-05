<h1 align="center">edusharing-opencast-importer</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.2.1-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/virtUOS/edusharing-opencast-importer/blob/main/LICENSE" target="_blank">
    <img alt="License: GPLv3" src="https://img.shields.io/badge/License-GPLv3-green.svg" />
  </a>
  <a href="https://github.com/virtUOS/edusharing-opencast-importer/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
</p>

> <strong>HIGHLY IN DEVELOPMENT: Do not use for production</strong><br><br>
> This importer harvests episodes and series (lecture recordings) from Opencast instances and pushes them as external references to an Edu-Sharing instance.

## Requirements
* Edu-Sharing 6.0
* NodeJS 10.12.0 or higher

## Install

1. Clone repository and change into repository folder
2. Install dependencies `npm install`

## Config Minimum

1. Add new user to your Edu-Sharing instance. For more information see [Edu-Sharing documentation](https://docs.edu-sharing.com/confluence/edp/de/administration/managing-user-groups/nutzer-verwalten).
2. Rename `.env.template` file to `.env`
3. Edit `.env` file as described in the comments.<br />Minimum required variables are Edu-Sharing host specs (protocol, domain), user and password.
```sh
# (Required) Edu-Sharing host
ES_HOST_PROTO=http
ES_HOST_DOMAIN=localhost

# (Required) Edu-Sharing User to publish Opencast content with
ES_USER=opencast
ES_PASSWORD=opencast
```
4. Rename `config.oc-instances.js.template` to `config.oc-instances.js` in folder `./src/config/`
5. Edit `./src/config/config.oc-instances.js` and add Opencast instances as JSON objects (orgName, orgUrl, protocol, domain). Keys with org Prefix are nescessary for a minimal metadata set of Edu-Sharing nodes.<br />
```js
{
  orgName: 'Opencast',
  orgUrl: 'https://opencast.org',
  protocol: 'https',
  domain: 'develop.opencast.org'
}
```

## Usage

1. Run `npm start` in repository directory.
```sh
npm start
// or directly
node src/index.js
```

## Config Details
Config file can be found in `src/config/config.js`. It contains four JSON objects each for Edu-Sharing, Opencast, Logger and Filter functionalities.

```js
config.es = {
  // Edu-Sharing instance config from .env file
  host: {
    // [...]
  },
  // Edu-Sharing http requests settings
  settings: {
    // Maximal number of http requests send to Edu-Sharing instance at once.
    // Reduce value to reduce Edu-Sharing load. 
    // Increase carefully: In some cases Edu-Sharing was not able to process more than 2 requests parallel. 
    maxPendingPromises: 2
  },
  // Edu-Sharing API routes
  routes: {
    // [...]
  }
}
```

```js
config.oc = {
  // Force update episodes and series from Opencast instances
  forceUpdate: false,
  // Opencast instances from /src/config/config.oc-instances.js
  instances: ocInstances,
  // Opencast http requests settings
  settings: {
    maxPendingPromises: 2, // Maximal number of simultaneous https requests
    requestOffset: 5 // Number of requested episodes and series (like pagination)
  },
  // Opencast API routes
  routes: {
    // [...]
  },
  // Storage file names
  filenames: {
    episodes: 'ocEpisodes.json',
    series: 'ocSeries.json',
    episodesData: 'episodesData.json',
    seriesData: 'seriesData.json'
  }
}
```

```js
// Logger settings
config.logger = {
  folderPath: './logs/',
  dateBasedFileNaming: true,
  fileNamePrefix: 'es-oc-importer_',
  fileNameExtension: '.log',
  timeZone: 'Europe/Berlin',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  logLevel: 'debug',
  onlyFileLogging: false
}
```

```js
// Filter settings (only harvest episodes with allowed licences)
// Mind the formatting if you add new licences like CC-BY-NC-ND
config.filter = {
  allowedLicences: ['CC0', 'CC-BY', 'CC-BY-SA', 'PD', 'PDM']
}
```

## Mapping

Define mapping of opencast-values to edu-sharing-values in `src/config/mapping.js`.

## Import Workflow

1. Get all published episodes from Opencast Instance
2. Filter episodes by open licences
3. Get all published series from Opencast Instance
4. Edu-Sharing authentication (Basic auth or Bearer token)
5. Create folder structure in Edu-Sharing user workspace (a folder for every Opencast series)
6. Create a node/children for every episode (Alfresco API)
7. Update metadata for all nodes/childrens
8. Update thumbnails/preview images for episodes nodes/children
9. Set permissions for all nodes/childrens to public

## Develop

1. Setup development environment. You can use the [official Edu-Sharing docker container](https://hub.docker.com/r/edusharing/repo-rs-moodle/).
2. Follow all minimum config steps as described above.
3. Run nodemon to watch for file changes
```sh
npm run dev
```

## Format & Lint

Linting and formatting is run by a husky-hook with every commit. See `package.json` file for config.

You can also run linting and formatting via this commands:

```sh
npm run format
npm run lint
npm run lint:fix
```

## Author

💻 **virtUOS (University Osnabrück)**

* www: [virtuos.uni-osnabrueck.de](https://virtuos.uni-osnabrueck.de/)
* Github: [@virtUOS](https://github.com/virtUOS)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/virtUOS/edusharing-opencast-importer/issues). 

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_

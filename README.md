<h1 align="center">edusharing-opencast-importer</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/virtUOS/edusharing-opencast-importer/blob/main/LICENSE" target="_blank">
    <img alt="License: GPLv3" src="https://img.shields.io/badge/License-GPLv3-green.svg" />
  </a>
  <a href="https://github.com/virtUOS/edusharing-opencast-importer/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
</p>

> <strong>HIGHLY IN DEVELOPMENT: Do not use for production</strong><br><br>
> This importer harvests episodes and series (lecture recordings) from Opencast instances and pushes them as external references to an Edu-Sharing instance.

## Install

1. Clone repository and change into repository folder
2. Install dependencies `npm install`

## Config Minimum

1. Add new user to your Edu-Sharing instance 
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
5. Edit `./src/config/config.oc-instances.js` and add Opencast instances as JSON objects (protocal, domain). <br /><strong>LIMITATION: Currently, only the first object in the instance array is used..</strong>
```js
{
  protocol: 'https',
  domain: 'develop.opencast.org'
}
```

## Config Details

Will be added later.

## Import Workflow

1. Get all published episodes from Opencast Instance
2. Filter episodes by open licences
3. Get all published series from Opencast Instance
4. Edu-Sharing authentication (Basic auth or Bearer token)
5. Create folder structure in Edu-Sharing user workspace (a folder for every Opencast series)
6. Create a node/children for every episode (Alfresco API)
7. Update metadata for all nodes/childrens
8. Set permissions for all nodes/childrens to public

## Develop

1. Setup development environment. You can use the official Edu-Sharing docker container.<br />
https://hub.docker.com/r/edusharing/repo-rs-moodle/

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

👤 **Florian Feyen**

* Github: [@ffeyen](https://github.com/ffeyen)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/virtUOS/edusharing-opencast-importer/issues). 

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
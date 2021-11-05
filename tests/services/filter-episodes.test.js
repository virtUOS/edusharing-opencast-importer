const filter = require('../../src/services/filter-episodes')

test('remove not fitting objects from array', () => {
  const allowedLicences = ['CC0', 'CC-BY', 'CC-BY-SA', 'PD']

  const episodes = [
    { dcLicense: 'CC0' },
    { dcLicense: 'CC-BY' },
    { dcLicense: 'CC-BY-SA' },
    { dcLicense: 'PD' },
    { dcLicense: 'CC-BY-ND' },
    { dcLicense: 'CC-BY-NC' },
    { dcLicense: 'CC-BY-SA-NC' },
    { dcLicense: null },
    { dcLicense: undefined }
  ]

  expect(filter.filterAllowedLicensedEpisodes(episodes, allowedLicences, {}).length).toBe(4)
})

#!/usr/bin/env node --max-old-space-size=8192
require('dotenv').config()
const {promisify} = require('util')
const bluebird = require('bluebird')
const Keyv = require('keyv')
const {point} = require('@turf/turf')
const {chain, omit} = require('lodash')
const eos = promisify(require('end-of-stream'))
const {mkdirp, pathExists} = require('fs-extra')
const {PRELOADED_DB_PATH} = require('../lib/env')
const {isWithinCommune} = require('../lib/contours')
const {getCodeDepartement, getCommune} = require('../lib/cog')
const {createWritableGeoJSON} = require('../lib/util')

const preloadedDb = new Keyv(PRELOADED_DB_PATH)

async function buildDepartement(codeDepartement, codesCommunes) {
  const path = `dist/adresses-ftth-${codeDepartement}.geojson.gz`
  if (await pathExists(path)) {
    // Console.log(`Département ${codeDepartement} ignoré - fichier déjà présent`)
    return
  }

  console.log(`Département ${codeDepartement}`)
  const result = createWritableGeoJSON(path)

  await bluebird.mapSeries((codesCommunes), async codeCommune => {
    const adresses = await preloadedDb.get(codeCommune)

    adresses.forEach(adresse => {
      if (!isWithinCommune([adresse.lon, adresse.lat], codeCommune)) {
        adresse.exterieurCommune = true
        console.log('⛔️ Adresse située en dehors de sa commune de rattachement !')
      }

      adresse.nomCommune = getCommune(adresse.codeCommune).nom
      result.write(point([adresse.lon, adresse.lat], omit(adresse, 'lat', 'lon')))
    })
  })

  result.end()
  await eos(result)
}

async function main() {
  const communes = await preloadedDb.get('communes')
  await mkdirp('dist')

  const departements = chain(communes)
    .groupBy(getCodeDepartement)
    .map((codesCommunes, codeDepartement) => ({codeDepartement, codesCommunes}))
    .value()

  await bluebird.mapSeries(departements, ({codeDepartement, codesCommunes}) => {
    return buildDepartement(codeDepartement, codesCommunes)
  })
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

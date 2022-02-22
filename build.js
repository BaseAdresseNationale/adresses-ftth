#!/usr/bin/env node --max-old-space-size=8192
const path = require('path')
const {createReadStream} = require('fs')
const {Transform} = require('stream')
const bluebird = require('bluebird')
const {createGunzip} = require('gunzip-stream')
const getStream = require('get-stream').array
const csvParse = require('csv-parser')
const {chain, omit} = require('lodash')

const {getCodeCommune} = require('./lib/codes-postaux')
const {getCodeDepartement, getCommune} = require('./lib/cog')
const {repairNomVoie, repairTypeVoie} = require('./lib/repair-string')
const {writeCompressedGeoJSON} = require('./lib/util')

const distPath = path.join(__dirname, 'dist')

function getValue(str) {
  if (str && str !== '""') {
    return str.trim()
  }
}

function getNumero(str) {
  const numero = getValue(str)
  if (!numero || !/^\d+$/.test(numero)) {
    return
  }

  return Number.parseInt(numero, 10)
}

function getCoordinate(str) {
  if (!str) {
    return
  }

  return Number.parseFloat(Number.parseFloat(str).toFixed(6))
}

async function build(path) {
  let rows = 0
  let noNumero = 0
  let noNomVoie = 0
  let noCodeCommune = 0
  let noGeo = 0
  let accepted = 0

  const items = await getStream(
    createReadStream(path)
      .pipe(createGunzip())
      .pipe(csvParse({separator: ','}))
      .pipe(new Transform({
        transform(row, enc, cb) {
          rows++
          if (rows % 50_000 === 0) {
            console.log(`${rows} lignes lues`)
          }

          const codeCommune = getCodeCommune(row.code_poste, row.nom_com)
          const numero = getNumero(row.num_voie)

          const nomVoie = [
            repairTypeVoie(getValue(row.type_voie)),
            repairNomVoie(getValue(row.nom_voie))
          ].filter(Boolean).join(' ')

          const lon = getCoordinate(row.x)
          const lat = getCoordinate(row.y)

          if (!lon || !lat) {
            noGeo++
            return cb()
          }

          if (!codeCommune) {
            noCodeCommune++
            return cb()
          }

          if (!nomVoie) {
            noNomVoie++
            return cb()
          }

          if (!Number.isInteger(numero)) {
            noNumero++
            return cb()
          }

          accepted++

          const commune = getCommune(codeCommune)

          cb(null, {
            id: getValue(row.imb_id),
            codeCommune,
            nomCommune: commune ?? commune.nom,
            codePostal: codeCommune === row.code_poste ? undefined : row.code_poste,
            numero,
            suffixe: getValue(row.cp_no_voie) || undefined,
            nomVoie,
            lon,
            lat
          })
        },
        objectMode: true
      }))
  )

  const groupedAdresses = chain(items)
    .groupBy(a => getCodeDepartement(a.codeCommune))
    .map((adresses, codeDepartement) => ({codeDepartement, adresses}))

  await bluebird.mapSeries(groupedAdresses, async ({codeDepartement, adresses}) => {
    await writeCompressedGeoJSON(
      path.join(distPath, `adresses-ftth-${codeDepartement}.geojson.gz`),
      adresses.map(a => ({
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [a.lon, a.lat]},
        properties: omit(a, 'lat', 'lon')
      }))
    )
    console.log(`saved ${codeDepartement}`)
  })

  console.log(`${noCodeCommune} lignes sans code commune identifié`)
  console.log(`${noNomVoie} lignes sans nom de voie identifiée`)
  console.log(`${noNumero} lignes sans numéro identifié`)
  console.log(`${noGeo} lignes sans coordonnées géographiques`)
  console.log(`${rows} lignes lues`)
  console.log(`${accepted} lignes acceptées`)
}

async function main() {
  await build(process.argv[2])
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

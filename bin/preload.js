#!/usr/bin/env node --max-old-space-size=8192
const {createReadStream} = require('fs')
const Keyv = require('keyv')
const bluebird = require('bluebird')
const {createGunzip} = require('gunzip-stream')
const getStream = require('get-stream').array
const csvParse = require('csv-parser')
const {chain} = require('lodash')
const through = require('through2').obj
const {PRELOADED_DB_PATH, ARCEP_FTTH_IMMEUBLES_PATH} = require('../lib/env')
const {getCodeCommune} = require('../lib/codes-postaux')

function getValue(str) {
  if (str && str !== '""') {
    return str
  }
}

function getNumero(str) {
  const numero = getValue(str)
  if (!numero || !numero.match(/^\d+$/)) {
    return
  }
  const parsedNumero = Number.parseInt(numero, 10)
  if (parsedNumero === 0 || parsedNumero >= 5000) {
    return
  }
  return String(parsedNumero)
}

const COORDINATE_PRECISION = 0.0000001

function getCoordinate(str) {
  return Math.round(Number.parseFloat(str) * (1 / COORDINATE_PRECISION)) * COORDINATE_PRECISION
}

async function preload(path) {
  const preloadedDb = new Keyv(PRELOADED_DB_PATH)
  await preloadedDb.clear()

  let count = 0

  const items = await getStream(
    createReadStream(path)
      .pipe(createGunzip())
      .pipe(csvParse())
      .pipe(through((row, enc, cb) => {
        count++
        if (count % 1000 === 0) {
          console.log(`Read ${count} rows`)
        }
        const codeCommune = getCodeCommune(row.code_poste, row.nom_com)
        const numero = getNumero(row.num_voie)
        const nomVoie = [getValue(row.type_voie), getValue(row.nom_voie)].filter(Boolean).join(' ')
        if (codeCommune && numero && nomVoie) {
          return cb(null, {
            codeCommune,
            codePostal: codeCommune === row.code_poste ? undefined : row.code_poste,
            numero,
            suffixe: getValue(row.cp_no_voie) || undefined,
            nomVoie,
            batiment: getValue(row.batiment) || undefined,
            lon: getCoordinate(row.x),
            lat: getCoordinate(row.y)
          })
        }
        return cb()
      }))
  )

  const groupedAdresses = chain(items)
    .groupBy('codeCommune')
    .map((adresses, codeCommune) => ({codeCommune, adresses}))

  await bluebird.mapSeries(groupedAdresses, async ({codeCommune, adresses}) => {
    await preloadedDb.set(codeCommune, adresses)
    console.log(`saved ${codeCommune}`)
  })

  await preloadedDb.set('communes', groupedAdresses.map(g => g.codeCommune))
}

async function main() {
  await preload(ARCEP_FTTH_IMMEUBLES_PATH)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

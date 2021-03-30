const {promisify} = require('util')
const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const {ensureFile} = require('fs-extra')
const {stringify} = require('geojson-stream')
const eos = promisify(require('end-of-stream'))
const pumpify = require('pumpify').obj

function createWritableGeoJSON(path) {
  return pumpify(
    stringify(),
    createGzip(),
    createWriteStream(path)
  )
}

async function writeCompressedGeoJSON(path, features) {
  await ensureFile(path)
  const file = createWritableGeoJSON(path)
  features.forEach(f => file.write(f))
  file.end()
  await eos(file)
}

module.exports = {createWritableGeoJSON, writeCompressedGeoJSON}

const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const {stringify} = require('geojson-stream')
const pumpify = require('pumpify').obj

function createWritableGeoJSON(path) {
  return pumpify(
    stringify(),
    createGzip(),
    createWriteStream(path)
  )
}

module.exports = {createWritableGeoJSON}

const {promisify} = require('util')
const {createWriteStream} = require('fs')
const {createGzip} = require('zlib')
const {ensureFile} = require('fs-extra')
const {stringify} = require('geojson-stream')
const eos = promisify(require('end-of-stream'))
const pumpify = require('pumpify').obj

async function writeCompressedGeoJSON(path, features) {
  await ensureFile(path)
  const file = createWriteStream(path)
  const stream = pumpify(
    stringify(),
    createGzip(),
    file
  )
  features.forEach(f => stream.write(f))
  stream.end()
  await eos(file)
}

module.exports = {writeCompressedGeoJSON}

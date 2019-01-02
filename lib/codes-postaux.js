const codesPostaux = require('codes-postaux')
const {deburr, memoize} = require('lodash')
const extractWords = require('talisman/tokenizers/words')
const {getCommune} = require('./cog')

function normalize(nomCommune) {
  return extractWords(deburr(nomCommune).toLowerCase()).join(' ')
}

const CP_MAPPING = {
  97150: '97127',
  97133: '97123'
}

function getCodeCommune(code, nomCommune) {
  if (code in CP_MAPPING) {
    return CP_MAPPING[code]
  }
  const normalizedNomCommune = normalize(nomCommune)
  const candidates = codesPostaux.find(code)
  const commune = getCommune(code)
  if (commune) {
    candidates.push({
      codeCommune: commune.code,
      nomCommune: commune.nom
    })
  }
  const result = candidates.find(({nomCommune}) => {
    return normalize(nomCommune) === normalizedNomCommune
  })
  if (result) {
    return result.codeCommune
  }
}

module.exports = {
  normalize,
  getCodeCommune: memoize(getCodeCommune, ((...args) => `${args[0]}-${args[1]}`))
}

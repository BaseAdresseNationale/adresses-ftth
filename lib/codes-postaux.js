/* eslint unicorn/no-fn-reference-in-iterator: off */
const codesPostauxEtalab = require('codes-postaux/codes-postaux.json')
const {deburr, memoize, groupBy} = require('lodash')
const extractWords = require('talisman/tokenizers/words')
const {getCommune} = require('./cog')

const codesPostauxLaPoste = require('../codes-postaux.json')
  .map(row => ({
    libelleAcheminement: row.fields.libelle_d_acheminement,
    codeCommune: row.fields.code_commune_insee,
    codePostal: row.fields.code_postal,
    nomCommune: row.fields.nom_de_la_commune,
    ligne5: row.fields.ligne_5
  }))

const codesPostauxIndex = groupBy([...codesPostauxEtalab, ...codesPostauxLaPoste], 'codePostal')

function normalize(nomCommune) {
  return extractWords(deburr(nomCommune).toLowerCase()).join(' ')
    .replace('saint', 'st')
    .replace('sainte', 'ste')
}

const CP_MAPPING = {
  97150: '97127',
  97133: '97123'
}

function getCodeCommune(code, nomCommune, warn = true) {
  if (code in CP_MAPPING) {
    return CP_MAPPING[code]
  }

  const normalizedNomCommune = normalize(nomCommune)
  const candidates = codesPostauxIndex[code] || []

  // On ajoute le cas où le code postal est le code INSEE (inversion)
  const commune = getCommune(code)
  if (commune) {
    candidates.push({
      codeCommune: commune.code,
      nomCommune: commune.nom
    })
  }

  const result = candidates.find(({nomCommune, libelleAcheminement, ligne5}) => {
    return normalize(nomCommune) === normalizedNomCommune ||
      normalize(libelleAcheminement) === normalizedNomCommune ||
      normalize(ligne5) === normalizedNomCommune
  })
  if (result) {
    return result.codeCommune
  }

  if (warn) {
    console.log(`❌ codeCommune non trouvé pour le couple ${code} ${nomCommune}`)
  }
}

module.exports = {
  normalize,
  getCodeCommune: memoize(getCodeCommune, ((...args) => `${args[0]}-${args[1]}`))
}

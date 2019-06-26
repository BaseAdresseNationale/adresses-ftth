const {keyBy} = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['commune-actuelle', 'arrondissement-municipal'].includes(c.type))

const MANUALLY_ADDED_COMMUNES = [
  {code: '97127', nom: 'Saint-Martin'},
  {code: '97123', nom: 'Saint-Barthelemy'}
]

const indexedCommunes = keyBy([...communes, ...MANUALLY_ADDED_COMMUNES], 'code')

function getCommune(codeCommune) {
  return indexedCommunes[codeCommune]
}

function getCodeDepartement(codeCommune) {
  if (codeCommune.startsWith('97')) {
    return codeCommune.substr(0, 3)
  }

  return codeCommune.substr(0, 2)
}

module.exports = {getCodeDepartement, getCommune}

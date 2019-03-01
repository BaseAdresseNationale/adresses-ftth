const {memoize} = require('lodash')
const {createFantoirMatcher} = require('@etalab/adresses-util')

async function createCommuneContext(codeCommune) {
  const fantoirMatcher = await createFantoirMatcher(codeCommune)
  let pseudoCodesVoiesSequence = 1

  function getNextCodeVoie() {
    const num = pseudoCodesVoiesSequence++
    if (num < 1000) {
      return 'X' + String(num).padStart(3, '0')
    }
    if (num < 2000) {
      return 'Y' + String(num - 1000).padStart(3, '0')
    }
    if (num < 3000) {
      return 'Z' + String(num - 2000).padStart(3, '0')
    }
    throw new Error('Limite FANTOIR pseudo-voies atteinte')
  }

  return {
    getCodeVoie: memoize(nomVoie => {
      const codeVoie = fantoirMatcher.findCodeVoie(nomVoie)
      if (codeVoie) {
        return codeVoie
      }
      return getNextCodeVoie()
    })
  }
}

module.exports = {createCommuneContext}

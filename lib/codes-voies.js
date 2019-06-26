const {memoize} = require('lodash')
const {createFantoirCommune} = require('@etalab/fantoir')

async function createCommuneContext(codeCommune) {
  const fantoirCommune = await createFantoirCommune(codeCommune)
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
      const voie = fantoirCommune.findVoie(nomVoie)
      if (voie) {
        return voie.codeFantoir
      }

      return getNextCodeVoie()
    })
  }
}

module.exports = {createCommuneContext}

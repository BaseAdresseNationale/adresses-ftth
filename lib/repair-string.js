const {deburr} = require('lodash')

const specials = 'àâäéèêëùûüïîôö'.split('')

function repairNomVoie(str) {
  if (!str) {
    return
  }

  for (const char of specials) {
    const brokenChar = Buffer.from(char).toString('latin1').toLowerCase()
    str = str.replace(new RegExp(brokenChar, 'g'), char)
  }

  return str
}

function repairTypeVoie(str) {
  if (!str) {
    return
  }

  for (const char of specials) {
    const brokenChar = deburr(Buffer.from(char).toString('latin1').toLowerCase())
    str = str.replace(new RegExp(brokenChar, 'g'), char)
  }

  return str
}

module.exports = {repairNomVoie, repairTypeVoie}

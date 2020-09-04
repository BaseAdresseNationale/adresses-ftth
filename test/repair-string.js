const test = require('ava')
const {repairNomVoie, repairTypeVoie} = require('../lib/repair-string')

test('repairNomVoie()', t => {
  t.is(repairNomVoie('des ruchã¨res'), 'des ruchères')
})

test('repairTypeVoie()', t => {
  t.is(repairTypeVoie('alla©e'), 'allée')
})

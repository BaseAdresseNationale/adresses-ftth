const test = require('ava')
const {getCodeCommune} = require('../lib/codes-postaux')

test('10800 ST-JULIEN-LES-VILLAS', t => {
  t.is(getCodeCommune(10_800, 'ST-JULIEN-LES-VILLAS', false), '10343')
})

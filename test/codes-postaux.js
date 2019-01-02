const test = require('ava')
const {getCodeCommune} = require('../lib/codes-postaux')

test('10800 Saint-Julien-les-Villas', t => {
  t.is(getCodeCommune(10800, 'Saint-Julien-les-Villas'), '10343')
})

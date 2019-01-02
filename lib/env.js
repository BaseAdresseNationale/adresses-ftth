require('dotenv').config()

module.exports = {
  ...process.env,
  PRELOADED_DB_PATH: process.env.PRELOADED_DB_PATH || 'sqlite://.tmp.sqlite'
}

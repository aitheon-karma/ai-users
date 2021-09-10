const path = require('path');
const fs = require('fs');
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const env = require('dotenv').config({ path: envPath });
  if (env.error) {
    console.error(env.error);
  }
}

const environment = process.env.NODE_ENV || 'development';
const _ = require('lodash');

const core = require(`./core/${ environment }`);
const appConfig = require(`./app/${ environment }`);

module.exports = _.merge({}, core, appConfig);

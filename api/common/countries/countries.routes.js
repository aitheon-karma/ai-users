const countries = require('./countries.controller');
const policy = require('../../core/policy.controller');

module.exports = (app) => {
    app.route('/api/common/countries/getCountries')
        .get(policy.processUser, countries.getCountries);
};
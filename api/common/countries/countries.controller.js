
const path = require('path');
const data = require(path.resolve('./api/common/countries/country-states-list.json'));

exports.getCountries = (req, res) => {
    return res.status(200).send(data);
}
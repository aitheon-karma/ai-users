const mongoose     = require('mongoose');
const path         = require('path');
const AppGroup     = mongoose.model('UserAppGroup');
const errorHandler = require(path.resolve('./api/core/errors.controller'));

/*
  App Group List by user or organization Id
*/
exports.list = async (req, res) => {
  try {
    const organization = req.headers['organization-id'];
    const query        = { user: req.currentUser._id };
    query.organization = organization ? organization : { $eq: null };
    const appGroups    = await AppGroup.find(query).lean();

    return res.jsonp(appGroups);
  } catch (e) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(e)
    });
  }
}

/*
  Save App Group
*/
exports.save = async (req, res) => {
  try {
    const organization = req.headers['organization-id'];
    const query        = { user: req.currentUser._id };
    query.organization = organization ? organization : { $eq: null };

    await AppGroup.update(query, { ...query, applications: req.body.applications }, { upsert: true }).lean();

    return res.sendStatus(201);
  } catch (e) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(e),
    });
  }
}

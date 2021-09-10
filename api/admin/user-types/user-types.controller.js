const mongoose = require('mongoose');
var slugify = require('slugify');

const UserType = mongoose.model('UserType');
const User = mongoose.model('User');
const errorHandler = require('../../core/errors.controller');


exports.create = (req, res) => {
  const userType = new UserType(req.body);
  userType._id = slugify(userType._id, '_');
  userType.save((err, userType) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(userType);
  });

}

exports.list = (req, res) => {
  UserType.find({isActive: true}).exec((err, userTypes) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(userTypes);
  });
};

exports.listAll = (req, res) => {
  UserType.find({}).exec((err, userTypes) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(userTypes);
  });
};



exports.delete = (req, res) => {
  const { typeId } = req.params;

  User.updateMany({type: {$in: [typeId]}}, { $pull: { type: typeId } }, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    UserType.findByIdAndDelete({ _id: typeId }, ((err, userType) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err),
        });
      }
      return res.jsonp(userType);
    }));
  })

}

exports.update = (req, res) => {

  const { typeId } = req.params;

  UserType.findByIdAndUpdate({ _id: typeId }, {
    $set: req.body
  }, { new: true }).exec((err, userType) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(userType);
  });
}


exports.getById = (req, res) => {
  const { typeId } = req.params;

  const getType = ((err, type) => {
    if (err || !type) {
      return res.status(422).send({
        "message": "Could not load type"
      });
    }
    return res.jsonp(type);
  });

  UserType.findOne({
    _id: typeId
  }).exec(getType);
};


const mongoose = require('mongoose');
const ServiceSetup = mongoose.model('ServiceSetup');


exports.list = (req, res) => {
  let organizationId = req.currentOrganization._id;

  ServiceSetup.find({ organization: organizationId, unconfigured: true }).exec((err, serviceSetups) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(serviceSetups);
    });
}

exports.delete = (req, res) => {
  let organizationId = req.currentOrganization._id;
  let service = req.params.service;

  ServiceSetup.findOneAndDelete({ organization: organizationId, unconfigured: true, service }).exec((err, serviceSetups) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(serviceSetups);
    });
}

exports.activateService = (req, res, next) => {

  let organizationId = req.params.organizationId;
  let service = req.body.service;
  const setup = {
    organization: organizationId,
    service,
    unconfigured: true
  };

  ServiceSetup.findOne(setup).exec((err, serviceSetup) => {

    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    if (serviceSetup) {
      return next();
    }

    ServiceSetup.create(setup, (err, serviceSetup) => {

      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      next();
    });

  });


}

exports.unconfigureService = (req, res) => {

  let service = req.body.service;
  let organizationId = req.body.organization;

  const setup = {
    organization: organizationId,
    service,
    unconfigured: true
  };

  ServiceSetup.findOne(setup).exec((err, serviceSetup) => {

    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    if (serviceSetup) {
      return res.json(serviceSetup);
    }

    ServiceSetup.create(setup, (err, serviceSetup) => {

      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      return res.json(serviceSetup);
    });

  });


}


/*
 * Module dependencies.
 */
const _ = require('lodash'),
  express = require('express'),
  mongoose = require('mongoose'),
  Settings = mongoose.model('Settings'),
  News = mongoose.model('News'),
  Widget = mongoose.model('Widget'),
  mailer = require('../core/mailer'),
  path = require('path'),
  handlebars = require('handlebars'),
  fs = require('fs'),
  FAQ = mongoose.model('FAQ'),
  Tutorial = mongoose.model('Tutorial'),
  moment = require('moment'),
  UserType = mongoose.model('UserType');
DashboardSettings = mongoose.model('DashboardSettings'),
  policyController = require('../core/policy.controller'),
  errorHandler = require('../core/errors.controller');
widgetConfig = require('./dashboard-widget.config');
const integrations = require('../shared/integrations');
const logger = require('../core/logger');
const { ErrorUndefinedState, ErrorConflict, CustomError, errorResponse } = require('../core/errors.controller');

const defaultSettings = new Settings({
  dashboard: {
    showWelcome: false,
    welcomeHtml: '',
    skipWelcomeVideo: false
  }
})

/*
 * Get
 */
exports.getSettings = (req, res) => {
  Settings.findOne({}).lean().exec((err, settings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    let result = settings || defaultSettings
    return res.json(_.pick(result, 'dashboard'));
  });
};

/*
 * Get Dashboard Settings
 */
exports.getDashboardSettings = (req, res) => {
  const organization = req.headers['organization-id'];
  const query = { user: req.currentUser._id };
  if (organization) {
    query.organization = organization;
  } else {
    query.organization = { $eq: null };
  }
  DashboardSettings.findOne(query).lean().exec((err, settings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    return res.json(settings);
  });
};

/**
 * Update Dashboard settings
 */
exports.updateDashboardSettings = (req, res) => {
  const dashId = req.params.dashId;
  DashboardSettings.findByIdAndUpdate(dashId, req.body).lean().exec((err, settings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    return res.json(settings);
  });

};

/**
 *
 * @param {*} req
 * @param {*} res
 */
exports.getNews = (req, res) => {
  const toDay = moment();
  const lastDay = moment().subtract(30, 'days');
  let date = { createdAt: { $gte: lastDay, $lt: toDay } };
  let query = { show: true };
  const limit = 1;
  let page = (parseInt(req.query.page) - 1);
  if (page < 0) {
    page = 1;
  }
  const skip = page * limit;
  async.parallel([
    (done) => {
      News.find({
        $and: [query, date]
      }).sort('-createdAt').skip(skip).limit(limit).lean().exec(done);
    },
    (done) => {
      News.count({
        $and: [query, date]
      }).exec(done);
    }
  ], (err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    return res.json({
      news: result[0],
      count: result[1]
    });

  });

};

exports.getFAQ = (req, res) => {
  FAQ.find().sort('orderIndex').lean().exec((err, faqs) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    return res.json(faqs);
  });
};



exports.getWidgets = (req, res) => {

  policyController.getOrganization(req).then((organization) => {
    const query = { user: req.currentUser._id };
    if (organization) {
      query.organization = organization;
    } else {
      query.organization = { $eq: null };
    }
    DashboardSettings.findOne(query).exec((err, settings) => {
      if (settings && settings.initDone) {
        Widget.find(query).exec((err, widgets) => {
          if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          settings = settings.toObject();

          //TODO: Remove when creators studio is launched in prod
          if(['aitheon.com', 'prod.aitheon.com'].includes(process.env.DOMAIN)){
              settings.allWidgets = widgetConfig.ALL_WIDGETS().filter(w => w.component !== 'creator-studio');
              widgets = widgets.filter(w => w.component !== 'creator-studio');
          }else {
            settings.allWidgets = widgetConfig.ALL_WIDGETS();
          }

          return res.json({
            settings: settings,
            widgets: widgets
          });
        });
      } else {

        UserType.find({ _id: { $in: req.currentUser.type }, widgets: { $exists: true, $not: { $size: 0 } } }).exec((err, userTypes) => {
          if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          let selectedUserTypes = [];
          const widgets = _.cloneDeep(Array.from(new Set(Array.prototype.concat.apply([], userTypes.map(ut => ut.widgets)))));

          // Pushing default widgets
          for (const defaultWidget of widgetConfig.DEFAULT_WIDGETS) {
            selectedUserTypes.push(_.cloneDeep(defaultWidget));
          }

          for (const w of widgets) {
            if (widgetConfig[w]) {
              selectedUserTypes.push(_.cloneDeep(widgetConfig[w]));
            }
          }
          const userWidgets = selectedUserTypes.map((w, index) => {
            delete w._id;
            // Calculate postions
            // w.config = calculateDefaultWidgetPos(w.config.cols, w.config.rows, 2, index);
            w.user = req.currentUser._id;
            w.organization = organization;
            return w;
          });
          Widget.insertMany(userWidgets, (err, data) => {
            if (err) {
              return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
              });
            }
              settings = new DashboardSettings({
                initDone: true,
                user: req.currentUser,
                organization: organization
              });
              settings.save((err) => {
                if (err) {
                  return res.status(422).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                }
                settings = settings.toObject();
                settings.allWidgets = widgetConfig.ALL_WIDGETS();
                return res.json({
                  settings: settings,
                  widgets: data
                });
              });
          });
        });
      }
    });
  })
    .catch((err) => {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    })
};

// Todo: Configure widgets in database
exports.getAllWidgets = (req, res) => {

  const allWidgets = [];
  Object.keys(widgetConfig).forEach(function (key, index) {
    if (key === 'ALL_WIDGETS' || key === 'DEFAULT_WIDGETS' || typeof widgetConfig[key] !== 'object') { return; }
    allWidgets.push(widgetConfig[key]);
  });

  return res.json(allWidgets);
}


/**
 * Save
 */
exports.saveWidget = (req, res) => {

  policyController.getOrganization(req).then((organization) => {
    let widget = req.body;
    widget.user = req.currentUser;
    if (!organization) {
      widget.organization = undefined;
    } else {
      widget.organization = organization
    }
    if (widget._id) {
      Widget.findByIdAndUpdate(widget._id, widget, { new: true }).exec((err, widget) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        return res.json(widget);
      })
    } else {
      new Widget(widget).save((err, widget) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        return res.json(widget);
      })
    }
  });

};


/*
 * Remove
 */
exports.removeWidget = (req, res) => {
  const widgetId = req.params.widgetId;
  Widget.findByIdAndRemove(widgetId).exec((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    return res.sendStatus(204);
  });
};

/*
 * Get
 */
exports.getTutorials = (req, res) => {
  Tutorial.find().populate('media', 'name _id').sort('orderIndex').lean().exec((err, tutorials) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    return res.json(tutorials);
  });
};

exports.getOrgStats = (req, res) => {

  const fromDate = new Date(req.query.fromDate);
  const toDate = new Date(req.query.toDate);
  const organizationId = req.headers['organization-id'];
  const encodedData = encodeURI(JSON.stringify({ fromDate, toDate, organizationId }));
  const requestUrl = config.accountingURI + `/api/accounting-documents/company-health/${encodedData}?byDate=true`;

  doRequest(req, requestUrl,
    'GET', {}, ((err, callBack, body) => {
      return res.json(body);
    }));
}

const handleFeatureRequest = async (user, service, description, type, source) => {
  let profile = user.profile;
  let pld = {
    service,
    description,
    source
  };
  let name = '';
  if(user.email) {
    pld.email = user.email;
  }
  if(profile) {
    if(profile.phoneNumber) {
      pld.phone = profile.phoneNumber;
    }
    if(profile.firstName) {
      pld.first_name = profile.firstName;
    }
    if(profile.firstName) {
      pld.last_name = profile.lastName;
    }
    if(pld.first_name) {
      name += (pld.first_name + ' ');
    }
    if(pld.last_name) {
      name += pld.last_name;
    }
    pld.name = name;
    pld.title = `${name} - ${type}`;
  }
  return await integrations.pipedriveCRM.submit(pld, {createOrg: false});
}

exports.requestFeature = async (req, res) => {
  try {
    const user = req.currentUser;
    const { service, description, type, source } = req.body;
    const r = await handleFeatureRequest(user, service, description, type, source);

    return res.sendStatus(204);
  } catch(err) {
    logger.error(err);
    return res.sendStatus(500);
  }

}

function doRequest(req, endUrl, type, body, callBack) {
  if (req === null || req === undefined || endUrl === null || endUrl === undefined || type === null || type === undefined) {
    var parmError = new Error('invalid request');
    parmError.name = 'requestNotOk';
    callBack(parmError, output);
    return;
  }

  const token = policy.getTokenFromRequest(req);
  if (token === null || token === undefined || token === '') {
    var tokenError = new Error('token empty');
    tokenError.name = 'requestNotOk';
    callBack(tokenError, output);
    return;
  }

  var options = {
    url: endUrl,
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${token}`
    },
    method: type,
    json: true,
    body: body
  };

  request(options, function (error, response, body) {
    callBack(error, response, body);
  });
}

/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const async = require('async');
const mongoose = require('mongoose');
const Organization = mongoose.model('Organization');
const Service = mongoose.model('Service');
const Answer = mongoose.model('Answer');
const User = mongoose.model('User');
const Team = mongoose.model('Team');
const Username = mongoose.model('Username');
const DashboardSettings = mongoose.model('DashboardSettings');
const Question = mongoose.model('Question');
const ServiceSetup = mongoose.model('ServiceSetup');
const errorHandler = require('../core/errors.controller');
const policy = require('../core/policy.controller');
const externalRequest = require('request-promise-native');
const testMode = require('../../seed/test-mode');
const logger = require('../core/logger');
const { google } = require('googleapis');
const path = require('path');
const config = require(path.resolve('./config'));
const mailer = require('../core/mailer');
const broker = require('../broker');
const organizationsService = require('./organizations.service.js');
const errorsController = require('../core/errors.controller.js');

const AITHEON_ORG_ID = '5b456dc1a8ed350010ce7244';

/*
 * organization list
 */
exports.list = (req, res) => {
  // const allowedRoles = ['Owner', 'SuperAdmin', 'OrgAdmin'];
  // const orgIds = _(req.currentUser.roles)
  //                 .filter((userRole) => { return allowedRoles.indexOf(userRole.role) > -1; })
  //                 .map('organization').value();

  const orgIds = _.map(req.currentUser.roles, 'organization._id');

  Organization.find({ _id: { $in: orgIds } }).exec((err, organizations) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(organizations);
    }
  });
};

/**
 * Show the current organization
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var organization = req.organization ? req.organization.toJSON() : {};
  res.json(organization);
};

/*
 * Create new
 */

exports.domainExists = (req, res) => {
  const domain = req.params.domain;
  Organization.count({ domain }).exec((err, count) => {
    if (count > 0) {
      return res.status(422).send({ message: 'Domain already used.' });
    }

    return res.json({ message: 'ok' })
  });
}

exports.getDomain = (req, res) => {
  const organization = req.organization;
  return res.json(organization.domain);
}

exports.create = (req, res) => {
  if (!req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }
  let orgId = mongoose.Types.ObjectId();
  const usernameModel = new Username({ username: req.body.domain.toLowerCase(), usedFor: 'ORGANIZATION', reference: orgId });
  usernameModel.save((err, createdUsername) => {
    if(err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    };

    req.body.createdBy = req.currentUser._id;
    req.body._id = orgId;
    let organization = new Organization(req.body);
    // Owner/
    organization.save((err, organization) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      // async create new gitea user
      broker.instance.emit(`GiteaService.createOrganization`, { user: req.currentUser, organization: organization }, [`CREATORS_STUDIO${config.environment === 'production' ? '' : '_DEV'}`]);
      // async set up organization graph
      broker.instance.emit(`GraphsService.initOrganization`, { user: req.currentUser, organization: organization },[`SYSTEM_GRAPH${config.environment === 'production' ? '' : '_DEV'}`]);

      User.findByIdAndUpdate(req.currentUser._id, { $push: { roles: { organization: organization, role: 'Owner' } } }, function (err, result) {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        DashboardSettings.find({ user: req.currentUser._id, organization: { $ne: null }, isFirstCreated: true }, function (err, dashboardSettings) {
          if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          if (!dashboardSettings.length) {
            DashboardSettings.create({ user: req.currentUser._id, organization: organization._id, isFirstCreated: true }, function (err, dashboardSettings) {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              }
            })
          }
          return res.json(organization);
        });
      });
    });
  });

};




/*
 * Update organization
 */
exports.update = (req, res) => {
  let organization = req.organization;
  let checkUsername = Promise.resolve();
  if(req.body.domain && organization.domain !== req.body.domain){
    let promiseUsername = Username.findOne({reference: organization._id}).exec();
    checkUsername = promiseUsername.then((username)=>{
      username.username = req.body.domain;
      return username.save();
    }).catch((err)=>{
      if(err.name === 'MongoError' && err.code === 11000) {
        //Custom adjustment to not return generic "Username already exists" mongo error
        throw new Error("Domain already exists");
      } else {
        throw err;
      }
    });
  }
  organization = _.extend(organization, req.body);
  checkUsername.then(()=>{
      return organization.save();
    })
    .then(organization=>{
      res.jsonp(organization);
    })
    .catch(err=>{
      if(err){
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      };
    });
};

/*
 * Get Address
 */
exports.orgAddress = (req, res) => {
  if (!req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }

  Organization.findOne({ _id: req.organization._id }).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(result.address);
    }
  });
};


// Add document

exports.addDocument = (req, res) => {

  const orgId = req.organization._id;
  const token = policy.getTokenFromRequest(req);
  let acl_url = `${config.driveURI}/api/acl`;
  let driveOptions = {
    url: acl_url,
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${token}`
    },
    json: true,
    body: {
      'level': 'FULL',
      'organization': orgId,
      'service': {
        '_id': 'USERS',
        'key': orgId,
        'keyName': ''
      },
      'public': true
    }
  };

  externalRequest(driveOptions, (error, response, body) => {

    if (error) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(error) || error
      });
    }

    Organization.findOneAndUpdate({ _id: orgId }, {
      $push: {
        documents: req.body
      }
    }, { new: true }).exec((err, result) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(result);
      }
    });

  });
}

exports.removeDocument = (req, res) => {
  Organization.findOneAndUpdate({ _id: req.organization._id, '_id': req.organization._id },
    { $pull: { 'documents': { _id: req.params.documentId } } }, { new: true }).exec((err, result) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(result);
      }
    });
};

/*
 * Create new Address
 */
exports.createNewAddress = (req, res) => {
  if (!req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }

  Organization.findByIdAndUpdate({ _id: req.organization._id }, { $push: { address: req.body.address } }).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(result);
    }
  });
};

/*
 * Update current Address
 */
exports.updateAddress = (req, res) => {
  if (!req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }

  Organization.update({ _id: req.organization._id, 'address._id': req.params.addressId }, { $set: { 'address.$': req.body.address } }).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(result);
    }
  });
};

/*
 * Delete current Address
 */
exports.removeAddress = (req, res) => {
  if (!req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }

  Organization.update({ _id: req.organization._id, 'address._id': req.params.addressId }, { $pull: { 'address': { _id: req.params.addressId } } }).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(result);
    }
  });
};

/*
 * Delete current Location
 */
exports.removeLocation = (req, res) => {
  if (!req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }

  Organization.update({ _id: req.headers['organization-id'] }, { $pull: { locations: { _id: req.params.locationId } } }).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(result);
    }
  });
};


/*
 * Delete organization

exports.delete = (req, res) => {
  let organization = req.organization;

  organization.remove((err, organization) => {
    if (err) {
      return res.status(422).send({
        message: err
      });
    } else {
      res.jsonp(organization);
    }
  });
};
 */

/**
 * organization middleware
 */
exports.organizationByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Organization is invalid'
    });
  }

  Organization.findById(id).exec((err, organization) => {
    if (err) {
      return next(err);
    } else if (!organization) {
      return res.status(404).send({
        message: 'No organization with that identifier has been found'
      });
    }
    req.organization = organization;
    next();
  });
};

/**
 * team middleware
 */
exports.teamByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Team is invalid'
    });
  }

  Team.findById(id).exec((err, team) => {
    if (err) {
      return next(err);
    } else if (!team) {
      return res.status(404).send({
        message: 'No team with that identifier has been found'
      });
    }
    req.team = team;
    next();
  });
};


// exports.addService = (req, res) => {
//   let serviceId = req.params.serviceId;
//   let organization = req.organization;

//   if (organization.services.filter((s) => { return s.toString() === serviceId; }).length > 0) {
//     return res.jsonp(organization);
//   }

//   organization.update({
//     $push: { 'services': serviceId }
//   }, (err, result) => {
//     if (err) {
//       return res.status(422).send({
//         message: errorHandler.getErrorMessage(err)
//       });
//     }
//     if (serviceId === 'HR') {
//       const servicePort = process.env.AI_HR_SERVICE_PORT || 3000;
//       const initURL = `http://ai-hr.ai-hr.svc.cluster.local:${servicePort}/api/init`;
//       request(initURL, {
//         json: true,
//         method: 'POST',
//         headers: {
//           'organization-id': organization._id.toString(),
//           'authorization': `JWT ${policy.getTokenFromRequest(req)}`
//         }
//       }, (err, response, body) => {
//         if (err) {
//           return res.status(422).send({
//             message: errorHandler.getErrorMessage(err)
//           });
//         }
//         res.jsonp(organization);
//       });
//     } else {
//       res.jsonp(organization);
//     }

//   });
// };

// exports.deleteService = (req, res) => {
//   let serviceId = req.params.serviceId;
//   let organization = req.organization;

//   organization.services.pull(serviceId);

//   organization.update({
//     $pull: { 'services': serviceId }
//   }, (err, result) => {
//     if (err) {
//       return res.status(422).send({
//         message: errorHandler.getErrorMessage(err)
//       });
//     } else {
//       res.jsonp(organization);
//     }
//   });
// };

exports.addTeam = (req, res) => {
  let team = new Team(req.body);

  team.save((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(team);
    }
  });
}

exports.updateTeam = (req, res) => {
  let team = req.team;

  team = _.extend(team, req.body);

  team.save((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(team);
    }
  });
}

exports.checkTestMode = (req, res) => {
  if (!req.organization) {
    return res.json({ mode: false });
  }

  return res.json({ mode: !!req.organization.testModeDate, testModeDate: req.organization.testModeDate });
}

exports.toggleTestMode = (req, res) => {
  let currentTestDate;

  if (req.body.mode && !req.currentUser.orgFeatureAccess) {
    return res.status(503).send({
      message: 'Disabled'
    });
  }

  async.waterfall([
    (done) => {
      const organizationId = req.query.organizationId;
      if (organizationId) {
        Organization.findById(organizationId).exec((err, organization) => {
          currentTestDate = organization.testModeDate;
          req.params.organizationId = organizationId;
          policy.orgAdminIsAllowed(req, res, () => {
            done(err, organization);
          })
        })
      } else {
        testMode.seedOrganization(req.currentUser).then((organization) => {
          done(null, organization)
        }, (err) => done(err))
      }
    },
    (organization, done) => {

      let testModeDate = null;
      if (req.body.mode) {
        testModeDate = new Date();
        if (organization.testModeDate) {
          // test mode is already enable. Prevent double activation
          return res.sendStatus(204);
        }
      } else {
        if (!organization.testModeDate) {
          // test mode is already disable. Prevent double activation
          return res.sendStatus(204);
        }
      }
      // console.log('testModeDate:', testModeDate);

      Organization.findByIdAndUpdate(mongoose.Types.ObjectId(organization._id.toString()), { $set: { testModeDate: testModeDate } }, (err, data) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        // console.log('Organization set test mode. Result', data);
        const token = policy.getTokenFromRequest(req);
        if (req.body.mode) {
          // wait 200 miliseconds to keep date more then start test mode
          setTimeout(() => {
            testMode.seed(organization, token).then(() => {
              res.json({
                domain: organization.domain
              });
            });
          }, 200);
        } else {
          testMode.clear(organization, currentTestDate, false, token).then(() => {
            res.sendStatus(204);
          });
        }
      });
    }
  ], (err) => {

  })

}

exports.clearTestMode = (req, res) => {
  const token = policy.getTokenFromRequest(req);
  testMode.clear(req.organization, req.organization.testModeDate, req.body.resetToDefault, token).then(() => {
    res.sendStatus(204);
  });
}

exports.search = (req, res) => {
  const term = decodeURIComponent(req.query.term);
  Organization.find({ name: new RegExp(term, 'i') }, '_id name address domain profile registeredOfficeDetails').limit(10).exec((err, organizations) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(organizations);
  })
}

/**
 * user list
 */
exports.listUsers = (req, res) => {
  const query = { 'roles': { $elemMatch: { organization: req.organization } } };
  // if (!req.query.includeMe){
  //   query._id = { $ne: req.currentUser._id };
  // }
  User.find(query, { 'email': 1, 'profile.firstName': 1, 'profile.lastName': 1, 'profile.avatarUrl': 1, 'roles': 1, 'flagged': 1}).populate('roles.teams', 'name').exec((err, users) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(users);
    }
  });
};

/**
 * get user details
 */
exports.getUser = (req, res) => {
  let organizationId = req.params.organizationId;
  let userId = req.params.userId;
  //const query = { 'roles': { $elemMatch: { organization: req.organization } } };
  const query = { $and: [{ 'roles': { $elemMatch: { organization: organizationId } } }, { _id: userId }] }
  User.find(query, '-salt -password').exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.json(user)
    }
  })
}

/**
 * get user details by email
 */
exports.getUserByEmail = (req, res) => {
  let organizationId = req.params.organizationId;
  let email = req.params.email;
  const query = { $and: [{ 'roles': { $elemMatch: { organization: organizationId } } }, { 'email': email }] }
  User.findOne(query, '-salt -password').exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.json(user)
    }
  })
}

/**
 * search users
 */
exports.searchUsers = (req, res) => {
  let organizationId = req.params.organizationId;
  const searchKey = decodeURIComponent(req.query.searchKey).trim();
  const fullName = searchKey.replace(/\s+/g, ' ').split(' ');

  let nameSearchCondition = [{
    'profile.firstName': { $regex: searchKey, $options: 'i' }
  },
  { 'profile.lastName': { $regex: searchKey, $options: 'i' } }];

  if (fullName.length === 2) {
    nameSearchCondition = [{
      'profile.firstName': { $regex: fullName[0], $options: 'i' },
      'profile.lastName': { $regex: fullName[1], $options: 'i' }
    }];
  }

  const query = {
    $and: [
      { 'roles.organization': { $ne: organizationId } },
      {
        $or: [
          { 'email': { $regex: searchKey, $options: 'i' } },
          ...nameSearchCondition
        ]
      }
    ]
  }
  User.find(query, { 'email': 1, 'profile.firstName': 1, 'profile.lastName': 1, 'profile.avatarUrl': 1, 'roles': 1 })
    .limit(20)
    .exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      else {
        res.json(user)
      }
    })
}

/**
 * add existing user to the org
 */

exports.addUser = (req, res) => {
  let organizationId = req.params.organizationId;
  let memberId = req.params.userId;
  let teams = req.body.teams;
  let services = req.body.services;
  let role = req.body.role;
  //const query = {userId,{$push:{'roles':{organizaiton:organizationId,services:services,teams:teams,role:role}}
  User.findByIdAndUpdate(memberId,
    {
      $push:
      {
        roles:
        {
          organization: organizationId,
          services: services,
          teams: teams,
          role: role
        }
      }
    }).exec((err, user) => {


      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      broker.instance.emit(`GiteaService.addOrgMember`, { user: { _id: memberId }, organization: { _id: organizationId } }, [`CREATORS_STUDIO${config.environment === 'production' ? '' : '_DEV'}`]);
      res.json(user)
    })
}
/**
 * update a user from org
 */

exports.updateUser = (req, res) => {
  let organizationId = req.params.organizationId;
  let memberId = req.params.userId;
  let role = req.body.role;
  let services = req.body.services;
  let teams = req.body.teams;
  User.findOneAndUpdate(
    { '_id': memberId, 'roles.organization': organizationId },
    {
      $set: {
        'roles.$.services': services,
        'roles.$.teams': teams,
        'roles.$.role': role
      }
    }
  )
  .select({'updatedAt': 1, '_id': 0})
  .exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.json(user)
    }
  })
}

/**
 * delete user(employee) from org
 */
exports.deleteUser = async (req, res) => {
  let organizationId = req.params.organizationId;
  let memberId = req.params.userId;
  let update = { $pull: { 'roles': { 'organization': organizationId } } };
  if(organizationId === AITHEON_ORG_ID) {
    update['$set'] = {platformRole: 'NONE'};
  }
  User.findOneAndUpdate(
    { '_id': memberId },
    update
  ).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    broker.instance.emit(`GiteaService.removeOrgMember`, { user: { _id: memberId }, organization: { _id: organizationId } }, [`CREATORS_STUDIO${config.environment === 'production' ? '' : '_DEV'}`]);
    res.json(user)
  })
}

/**
 * get services of org
 */

exports.services = (req, res) => {
  const organizationId = req.params.organizationId;
  Organization.findOne({ _id: organizationId }, { 'services': 1 }).exec((err, orgServices) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.json(orgServices.services);
    }
  })
}


/**
 * Organizations All Services
 */
exports.getOrgTypeServices = (req, res) => {
  Service.find({ $or: [{ serviceType: 'organization' }] }, '-gitUrl -k8sNamespace').exec((err, services) => {
    if (err) {
      return res.status(400).send({
        message: err
      });
    } else {
      res.jsonp(services);
    }
  });
};

/**
 * update Organization registration data
 */
exports.updateOrganization = (req, res) => {
  let organizationId = req.body.organizationId;
  let organization = new Organization();
  Organization.findOneAndUpdate({ '_id': organizationId },
    {
      $set: {
        'organization.$.name': req.body.data.name,
        'registeredOfficeDetails': req.body.data
      }
    }

  ).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.json(user)
    }
  })
}

/**
 * update organizatio services update
 */
// exports.updateOrganizationServices = (req, res) => {

//   let organizationId = req.params.organizationId;
//   let service = req.body.service;

//   Organization.findById(organizationId).exec((err, organizaiton) => {
//     const org = organizaiton.toObject();
//     if (org && org.services) {
//       const serviceIndex = _.findIndex(org.services, (s) => s === service);
//       if (serviceIndex >= 0) {
//         Organization.findByIdAndUpdate(organizationId, {
//           $pull: {
//             services: service
//           }
//         }).exec((err, user) => {
//           if (err) {
//             return res.status(422).send({
//               message: errorHandler.getErrorMessage(err)
//             });
//           }
//           else {
//             res.json({ user: user, message: "Service Updated " })
//           }
//         })
//       } else {
//         Organization.findByIdAndUpdate(organizationId, {
//           $push: {
//             services: service
//           }
//         }).exec((err, user) => {
//           if (err) {
//             return res.status(422).send({
//               message: errorHandler.getErrorMessage(err)
//             });
//           }
//           else {
//             res.json({ user: user, message: "Service Updated " })
//           }
//         })
//       }
//     }
//   })


// }

/**
 * get all locations
 *
 */
exports.getAllLocations = (req, res) => {
  let organizationId = req.params.organizationId;
  Organization.findOne({ '_id': organizationId }, { 'locations': 1 }).exec((err, locations) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.json(locations)
    }
  });
}


exports.saveLocations = (req, res) => {
  let organizationId = req.params.organizationId;
  const locations = req.body || [];
  const toBeUpdatedLoc = locations.filter(loc => loc._id);
  const toBeAddedLoc = locations.filter(loc => !loc._id);
  let pending = toBeUpdatedLoc.length + toBeAddedLoc.length + 1;
  Organization.update({ _id: organizationId }, {
    $pull: { locations: { _id: { $nin: toBeUpdatedLoc.map(loc => loc._id) } } }
  }, (err, data) => { pending--; if (!pending) { return res.json({ message: "Location Deleted" }) } });


  toBeUpdatedLoc.forEach(loc => {
    Organization.update({ _id: organizationId, 'locations._id': loc._id }, { 'locations.$': loc },
      (err, data) => { pending--; if (!pending) { return res.json({ message: "Location Updated" }) } });
  });

  toBeAddedLoc.forEach(loc => {
    Organization.update({ _id: organizationId }, { $push: { locations: loc } },
      (err, data) => { pending--; if (!pending) { return res.json({ message: "Location Created" }) } });
  });

}

exports.addLocation = async (req, res) => {
  try {
    let organizationId = req.params.organizationId || req.headers['organization-id'];
    const { location } = req.body;

    if (!location) {
      return res.status(503).send({
        message: 'Must be a location'
      });
    }

    location.position = await organizationsService.getLocationCoordinates(location.address);

    const result = await Organization.findByIdAndUpdate(organizationId, { $push: { locations: location }}, { new: true });
    return res.json(result);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }

}




exports.updateLocation = async (req, res) => {
  let organizationId = req.headers['organization-id'];
  let locationId = req.body._id;
  let locName = req.body.name;
  let locEmails = req.body.emails;
  let locPhoneNumbers = req.body.phoneNumbers;
  let locFaxNumbers = req.body.faxNumbers;
  let locAddress = req.body.address;
  let locLogo = req.body.logo;
  let type = req.body.type;
  let position = req.body.position;

  if (!req.body.position) {
    const locationOrg = await Organization.findOne({ 'locations._id': locationId }).lean();
    const location = locationOrg.locations.find(loc => loc._id.toString() === locationId);
    const isAddressChanged = !(JSON.stringify(location.address) === JSON.stringify(locAddress));

    if (isAddressChanged) {
      position = await organizationsService.getLocationCoordinates(locAddress);
    }
  }

  Organization.findOneAndUpdate({ '_id': organizationId, 'locations._id': locationId },
    {
      $set: {
        'locations.$.name': locName,
        'locations.$.emails': locEmails,
        'locations.$.phoneNumbers': locPhoneNumbers,
        'locations.$.faxNumbers': locFaxNumbers,
        'locations.$.address': locAddress,
        'locations.$.type': type,
        'locations.$.logo': locLogo,
        'locations.$.position': position
      },

    }, { new: true }).exec((err, updatedOrganization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        res.json({
          organizations: updatedOrganization
        });
      }
    });
}


//OMS APIs

/**
 * approveSupplier from OMS
 *
 */
exports.acceptSupplier = (req, res) => {
  let currentOrg = req.headers['organization-id'];
  let selectedOrg = req.params.orgId;
  Organization.findOneAndUpdate({
    _id: selectedOrg,
    'suppliers.organization': currentOrg
  },
    {
      $set: { 'suppliers.$.Status': 'ACCEPTED' }
    }).exec((err, updatedOrganization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        res.json({
          organizations: updatedOrganization
        });
      }
    });
}

/**
 * get all requester organizations of the current org
 */

exports.getRequesterOrganizations = (req, res) => {
  let organizationId = req.headers['organization-id'];
  Organization.find({
    'suppliers.organization': organizationId
  },
    { 'suppliers.$': 1, name: 1 }).exec((err, organizations) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        return res.json({
          organizations: organizations
        });
      }
    })
}



// Accounting API's

/**
 *  use to get organization settings by organization ID
 *
 */
exports.getById = (req, res) => {
  let currentOrg = req.headers['organization-id'];
  Organization.find({
    _id: currentOrg
  })
    .select('settings')
    .exec((err, organization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        res.json(organization)
      }
    });
}


/**
 * Use to update organization settings by organization ID
 *
 */
exports.updateSettings = (req, res) => {

  let currentOrg = req.headers['organization-id'];
  let settings = req.body;

  Organization.findOneAndUpdate({ _id: currentOrg }, { $set: { settings: settings } })
    .exec((err, settings) => {
      if (err) {
        return res.status(500).send({
          message: 'Something went wrong.'
        });
      }
      else {
        return res.status(200).send({
          message: 'Settings Saved.'
        })
      }
    })
}
// Procurement API's

/**
 * mySupplierList
 *
 */
exports.mySupplierList = (req, res) => {
  let organizationId = req.headers['organization-id'];
  Organization.findOne({ '_id': organizationId })
    .populate({ path: 'suppliers.organization', select: '_id name' })
    .exec((err, result) => {
      if (err) {
        return res.status(500).send({
          message: 'Undefined organization'
        });
      }
      else {
        return res.json(result)
      }
    });
}


/**
 * getUserOrganizations
 *
 */
exports.getUserOrganizations = (req, res) => {
  let emailID = req.params.email;
  User.aggregate([
    {
      $match: {
        email: emailID
      }
    },
    { '$unwind': { path: '$roles', preserveNullAndEmptyArrays: true } },

    {
      $lookup:
      {
        from: 'organizations',
        localField: 'roles.organization',
        foreignField: '_id',
        as: 'orgs'
      }
    },
    { $unwind: { path: '$orgs', preserveNullAndEmptyArrays: true } },
    {
      '$group': {
        '_id': '$_id',
        'orgs': { '$push': '$orgs' },
      }
    }
  ])
    .exec((err, userOrgs) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        return res.json({
          organizations: userOrgs
        })
      }
    });
}

/**
 * changeSupplierStatus
 *
 */
exports.changeSupplierStatus = (req, res) => {
  let currentOrg = req.headers['organization-id'];
  let supplierId = req.body.supplierId;
  let status = req.body.status;
  if (req.body.external) {
    supplierId = req.headers['organization-id'];
    status = req.body.status;
    currentOrg = req.body.supplierId;
  }
  Organization.findOneAndUpdate({ '_id': currentOrg },
    {
      $push:
      {
        suppliers:
          { organization: mongoose.Types.ObjectId(supplierId.toString()), Status: status, _id: false, requesterDate: new Date() }
      }
    }, { 'new': true })
    .exec((err, updatedOrganization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        return res.json({
          organizations: updatedOrganization
        })
      }
    });
}
/**
* getOrganizationList
*
*/
exports.getOrganizationList = (req, res) => {
  let organizationId = req.headers['organization-id'];
  Organization.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(organizationId.toString())
      }
    },
    {
      $unwind: {
        path: '$suppliers'
      }
    },
    {
      $lookup:
      {
        from: 'organizations',
        localField: 'suppliers.organization',
        foreignField: '_id',
        as: 'orgs'
      }
    },

    {
      $group: {
        _id: '$suppliers.Status', organization: { $push: { suppliers: '$suppliers', organization: '$orgs' } }
      }
    },
  ])
    .exec((err, organization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        return res.json({
          organizationList: organization
        })
      }
    });
}

/**
 * approveSupplier from Procurement
 *
 */
exports.approveSupplier = (req, res) => {
  let organizationId = req.headers['organization-id'];
  let supplierId = req.params.orgId
  Organization.findOneAndUpdate({
    _id: mongoose.Types.ObjectId(organizationId.toString()),
    'suppliers.organization': mongoose.Types.ObjectId(supplierId.toString())
  },
    {
      $set: { 'suppliers.$.Status': 'APPROVED' }
    })
    .exec((err, updatedOrganization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err
        });
      }
      else {
        return res.json({
          organizations: updatedOrganization
        })
      }
    });
}

/**
 * removeSupplierFromOrganization
 *
 */
exports.removeSupplierFromOrganization = (req, res) => {

  let organizationId = req.headers['organization-id'];
  let supplierId = req.params.orgId;

  Organization.findOneAndUpdate({
    _id: mongoose.Types.ObjectId(organizationId.toString()),
    'suppliers.organization': mongoose.Types.ObjectId(supplierId.toString())
  },
    { $pull: { suppliers: { organization: mongoose.Types.ObjectId(supplierId.toString()) } } }, { new: true })
    .exec((err, updatedOrganization) => {
      if (err) {
        return res.status(422).send({
          message: err.message || err

        });
      }
      else {
        return res.json({
          organizations: updatedOrganization
        })
      }
    });
}

/*
 * Create new for external
 */
exports.createForExternal = (req, res) => {

  req.body.createdBy = req.currentUser._id;
  let organization = new Organization(req.body);
  // Owner/
  organization.save((err, organization) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      User.findByIdAndUpdate(req.currentUser._id, { $push: { roles: { organization: organization, role: 'Owner' } } }, function (err, result) {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        res.jsonp(organization);
      });
    }
  });
};


/**
 * Search all members by key
 */
exports.searchMemberByKey = (req, res) => {
  let organizationId = req.params.organizationId;
  const searchKey = decodeURIComponent(req.query.searchKey);
  const organizations = req.query.orgIds.split(',');
  organizations.push(organizationId);
  const query = {
    $and: [
      { 'roles.organization': { $in: organizations } },
      {
        $or: [
          { 'email': { $regex: searchKey, $options: 'i' } },
          { 'profile.firstName': { $regex: searchKey, $options: 'i' } },
          { 'profile.lastName': { $regex: searchKey, $options: 'i' } }
        ]
      }
    ]
  };
  User.find(query)
    .exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      else {
        res.json(user)
      }
    })
}

function createNotifications(organization, token, services) {

  const url = `${config.taskURI}/api/tasks`;
  // add users also as a notification.
  const usersService = services.find(s => s === 'USERS');
  if (!usersService) {
    services.push('USERS');
  }

  async.waterfall([
    (done) => {
      Service.find({}).select('url _id name').exec((err, services) => {
        done(err, services);
      })
    },
    (allServices, done) => {
      for (const service of services) {

        const serviceObj = allServices.find(s => s._id === service);
        // Create task now
        const task = {
          service: service,
          action: {
            name: 'SERVICE_SETUP',
            redirect: serviceObj.url + (service === 'USERS' ? '/organizations/organization-detail/settings?edit=true' : '/settings?edit=true'),
            data: {
              label: service === 'USERS' ? 'Setup Organization' : 'Get Started'
            }
          },
          name: 'Set Up',
          description: `Setup ${serviceObj._id === 'USERS' ? 'Organization' : serviceObj.name} now.`,
          type: 'NOTIFICATION',
          isNotify: true,
          organization: organization._id,
          notifyDate: (new Date()).toISOString()
        }
        externalRequest(url, {
          headers: {
            'Content-type': 'application/json',
            'Authorization': `JWT ${token}`
          },
          json: true,
          method: 'POST',
          body: task
        }, (err, result) => {
          if (err) {
            logger.error('Failed to create notification tasks', err);
          }
        });
      }

      done()
    }
  ]);
}


exports.updateSetupServices = (req, res) => {

  const body = req.body;
  const organizationId = req.headers['organization-id'];
  const token = policy.getTokenFromRequest(req);

  if (!organizationId) {
    return res.status(503).send({
      message: 'Organization is undefined'
    });
  }
  async.waterfall([
    // getting all not configured answers
    (done) => {
      Answer.find({ organization: organizationId, configured: false, answered: true }).populate('question').lean().exec((err, answers) => {
        done(null, answers)
      });
    },
    (answers, done) => {
      Answer.updateMany({ organization: organizationId, configured: false }, { configured: true }, (err, result) => {
        done(null, answers);
      });
    },
    (answers, done) => {
      Service.find({_id: {$in: body.services}}).exec((err,services)=>{
        if(err){
          logger.error(err);
          done(err);
          return;
        }
        Organization.findById(organizationId).exec((err, organization)=>{
          if(err){
            logger.error(err);
            done(err);
            return;
          }
          if(organization){
            services = services && services
              .map(service=>service._id)
              .filter(service=>organization.services.indexOf(service) !== -1);
            if(services && services.length > 0){
              createNotifications(organization, token, services)
            }
            res.jsonp(_.pick(organization, ['domain', '_id']));
            done(null, answers, organization);
          }else{
            let err = new Error('Organization not found');
            done(err);
          }
        });
      });
    }
  ], (err, answers, organization) => {
    if (err) {
      logger.error('Onboarding error', err);
    }
    processConfigs(answers, organization._id.toString());
  });


  function processConfigs(answers, organizationId) {
    const allAnsweredOptions = [];
    for (const answer of answers) {
      const answeredOption = answer.question.options.find(o => o._id.toString() === answer.option.toString());
      allAnsweredOptions.push(answeredOption);
    }
    const allEnabledServices = allAnsweredOptions.map(o => o.enabledServices).reduce((e1, e2) => e1.concat(e2), []);
    const mergedConfigs = [];
    for (const enabledService of allEnabledServices) {
      const config = mergedConfigs.find(c => c.service === enabledService.service);
      if (!config) {
        mergedConfigs.push({ service: enabledService.service, config: JSON.parse(enabledService.config) });
      } else {
        Object.assign(config.config, JSON.parse(enabledService.config));
      }
    }
    if (mergedConfigs.length) {
      const serviceIds = mergedConfigs.map(c => c.service);
      Service.find({ _id: { $in: serviceIds } }, '_id url').lean().exec((err, services) => {
        for (const service of services) {
          const config = mergedConfigs.find(c => c.service.toString() === service._id.toString());
          config.url = `https://${process.env.DOMAIN}${service.url}/api/config/organization`;
        }
        sendRequests(mergedConfigs, organizationId);
      })
    }
  }


  function sendRequests(mergedConfigs, organizationId) {
    for (const serviceConfig of mergedConfigs) {
      externalRequest(serviceConfig.url, {
        headers: {
          'Content-type': 'application/json',
          'Authorization': `JWT ${token}`,
          'organization-id': organizationId
        },
        json: true,
        method: 'POST',
        body: serviceConfig.config
      }, (err, result) => {
        if (err) {
          logger.error(`Could not configure, Service:${serviceConfig.service}, OrganizationId: ${organizationId}`, err);
        }
      });
    }
  }

};

exports.attachService = async (req, res) => {
  try{
    const organization = req.organization;
    // REMOVE when HR service will be not only for aitheon org
    if (['aitheon.com', 'prod.aitheon.com'].includes(process.env.DOMAIN) && req.body.service == 'HR') {
      return res.status(422).send({
        message: 'Service in BETA. Only for Aitheon organization.'
      });
    }
    let result = await organizationsService.addServiceToOrg(organization, req.body.service);
    return res.jsonp(result);
  }catch(err){
    logger.error(err);
    return errorsController.errorResponse(res,err);
  }
};

exports.detachService = async (req, res) => {
  try {
    const organization = req.organization;
    let result = await organizationsService.removeServiceFromOrg(organization, req.body.service);
    return res.jsonp(result);
  } catch(err) {
    logger.error(err);
    return errorsController.errorResponse(res,err);
  }
};

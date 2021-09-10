/**
 * Module dependencies.
 */
const _ = require('lodash'),
  express = require('express'),
  jwt = require('jsonwebtoken'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Username = mongoose.model('Username'),
  Widget = mongoose.model('Widget'),
  DashboardSettings = mongoose.model('DashboardSettings'),
  OrganizationInvite = mongoose.model('OrganizationInvite'),
  Organization = mongoose.model('Organization'),
  Notification = mongoose.model('Notification'),
  Task = mongoose.model('Task'),
  Team = mongoose.model('Team'),
  errorHandler = require('../core/errors.controller'),
  policy = require('../core/policy.controller'),
  logger = require('../core/logger'),
  path = require('path'),
  fs = require('fs'),
  handlebars = require('handlebars'),
  config = require(path.resolve('./config')),
  async = require('async'),
  aws = require('aws-sdk'),
  escape = require('escape-regexp'),
  limit = require("simple-rate-limiter"),
  multer = require('multer'),
  shortid = require('shortid'),
  moment = require('moment'),
  multerS3 = require('multer-s3'),
  request = require('request'),
  cookie = require('cookie'),
  cache = require('memory-cache'),
  mailer = require('../core/mailer'),
  sharp = require('sharp'),
  broker = require('../broker'),
  externalRequest = require('request-promise-native'),
  OrganizationFollowers = mongoose.model('OrganizationFollowers'),
  USERNAME_REGEX = /^$|(?=^\w{3,20}$)[a-zA-Z0-9]+(?:[_ -]?[a-zA-Z0-9])*$/;

var tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/')
  },
  filename: function (req, file, cb) {
    var ext = file.originalname.split('.')
    cb(null, req.currentUser._id + '-' + Date.now() + '.' + ext[ext.length - 1])
  }
});

var uploadToTempDirectory = multer({ storage: tempStorage }).single('file');



// let KYCisRunning = false;
// const recheckKYC = () => {
//   setInterval(() => {
//     if (KYCisRunning) {
//       return logger.debug('[sendKYCRequest] KYCisRunning already. Waiting next interval.');
//     }
//     KYCisRunning = true;
//     // , {  KYCStatus: 'Denied' }
//     User.find({ $or: [{ KYCStatus: 'Pending' }] }).exec((err, users) => {
//       if (err) {
//         return logger.debug('[sendKYCRequest] error', err);
//       }
//       logger.debug('[sendKYCRequest] interval checker. Check Users=', users.length);
//       async.each(users, (user, userDone) => {
//         sendKYCRequest(user).then((result) => {
//           user.KYCStatus = result;
//           user.save((err) => {
//             userDone(err);
//           });
//         }, userDone);
//       }, (err) => {
//         KYCisRunning = false;
//         if (err) {
//           logger.error('[sendKYCRequest] interval check error:', err);
//         }
//         logger.debug('[sendKYCRequest] interval checker done.');
//       })
//     })
//   }, config.KYC.failedCheckInterval * 1000);

// }

// recheckKYC();

/**
 * User list
 */
exports.list = (req, res) => {
  const query = { 'roles': { $elemMatch: { organization: req.organization } } };
  // if (!req.query.includeMe){
  //   query._id = { $ne: req.currentUser._id };
  // }
  User.find(query, '-salt -password').exec((err, users) => {
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
 * List of Invites to organization
 */
exports.listInvites = (req, res) => {
  OrganizationInvite.find({ organization: req.organization }).populate('user').populate('inviteAccess.teams', 'name').exec((err, invites) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      invites = invites.map((i) => {
        return {
          invite: i.inviteAccess,
          _id: i._id.toString(),
          email: i.user ? i.user.email : i.newUserInfo.email,
          profile: i.user ? i.user.profile : i.newUserInfo.profile,
          user: i.user ? i.user : '',
          roles: i.user ? i.user.roles : []
        }
      });
      res.jsonp(invites);
    }
  });
};

/**
 * Delete and invite to organization
 */
exports.deleteInvite = (req, res) => {
  OrganizationInvite.findByIdAndRemove(req.params.inviteId).exec((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    Task.deleteOne({ 'action.referenceId': req.params.inviteId }).exec();
    res.json({});
  });
};

exports.setUsername = (req, res) => {
  const userId = req.currentUser._id;
  const { username } = req.body;
  const invalid = !(USERNAME_REGEX.test(username));
  if (invalid) {
    return res.status(400).send({ message: 'Invalid username' });
  }

  const usernameModel = new Username({ username: username.toLowerCase(), usedFor: 'USER', reference: userId });

  usernameModel.save((err, createdUsername) => {
      if (!createdUsername || err) {
        return res.status(400).send({ message: 'Invalid username' });
      }
      User.findOneAndUpdate({ _id: userId }, { username: username.toLowerCase() }).exec((err, user) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        return res.json({ username: username.toLowerCase(), saved: true });
      });
    });
};

exports.checkUsername = (req, res) => {
  const { username } = req.body;

  Username.countDocuments({ username: username.toLowerCase() }).exec((err, count) => {
    let available = true;
    if (count) {
      available = false;
    }
    const invalid = !(USERNAME_REGEX.test(username));
    return res.json({ available, invalid });
  });
};



/**
 * Invite user to organization
 */
exports.inviteToOrganization = (req, res) => {
  let userInvite = req.body;
  let organizationId = req.params.organizationId;

  let isNewUser = userInvite._id ? false : true;
  let isEmployee = !!req.query.isEmployee;

  async.waterfall([
    /**
    * First check if this user is already in this org
    */
    (done) => {
      let conditions = {};
      conditions._id = userInvite._id;
      conditions.email = userInvite.email;

      User.findOne(conditions, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null);
        } else {
          let orgExist = user.roles.findIndex((r) => { return r.organization.toString() === organizationId }) > -1;
          if (orgExist) {
            return res.status(400).send({
              message: 'The user already in this organization'
            });
          }
          done(null);
        }
      })
    },
    /**
     * Second check if this user is not already invited
     */
    (done) => {
      let conditions = { organization: organizationId };
      if (userInvite._id) {
        conditions.user = userInvite._id;
      } else {
        conditions['newUserInfo.email'] = userInvite.email;
      }
      OrganizationInvite.find(conditions, (err, invites) => {
        if (err) {
          return done(err);
        }
        if (invites.length > 0) {
          return res.status(400).send({
            message: 'The user already invited to this organization'
          });
        }
        done();
      });
    },
    /**
     * Create organization invite
     */
    (done) => {
      let organizationInvite = new OrganizationInvite({
        organization: organizationId,
        user: userInvite._id,
        inviteAccess: userInvite.organizationRole,
        createdBy: req.currentUser._id,
        isEmployee: isEmployee
      });
      if (userInvite._id) {
        organizationInvite.user = userInvite._id;
        User.findById(userInvite._id, (err, user) => {
          if (err) { return done(err) };

          organizationInvite.save((err, invite) => {
            done(err, user, null, invite);
          });
        })
      } else {
        User.generateRandomPassphrase().then((password) => {
          let userInfo = _.pick(userInvite, 'profile', 'email');

          let result = User.saltAndHasPassword(password);

          userInfo.salt = result.salt;
          userInfo.password = result.password;

          userInfo._id = organizationInvite._id.toString()

          organizationInvite.newUserInfo = userInfo;
          organizationInvite.save((err, invite) => {
            done(err, userInfo, password, invite);
          });
        });
      }
    },
    /**
     * Populate organization name
     */
    (user, password, invite, done) => {
      Organization.findById(organizationId, 'name', (err, organization) => {
        done(err, user, password, invite, organization);
      });
    },
    /**
     * Save notification if it's existing user
     */
    (user, password, invite, organization, done) => {
      if (isNewUser) {
        return done(null, user, password, invite, organization);
      }

      let task = new Task({
        description: `Invite to ${organization.name} organization`,
        assigned: [user._id],
        action: {
          name: 'organization-invite',
          referenceId: invite._id.toString()
        },
        service: 'USERS',
        type: 'NOTIFICATION'
      });

      task.save((err, notification) => {
        return done(err, user, password, invite, organization);
      });
    },
    /**
     * Render email
     */
    (user, password, invite, organization, done) => {

      let httpTransport = 'http://';
      if (config.secure) {
        httpTransport = 'https://';
      }
      let baseUrl = config.domain || httpTransport + req.headers.host;
      let inviteUrl = `${baseUrl}/users/api/users/organization-invite/${invite._id}`;
      let signURL = `${baseUrl}/hr/signing`;

      // console.log('inviteUrl', inviteUrl);

      // let isNewUser = user._id == null;

      res.render(path.resolve('api/users/templates/organization-invite.html'), {
        subject: isEmployee ? `Invite to ${organization.name}` : `Welcome on board at ${organization.name}`,
        name: user.profile.firstName,
        appName: config.web.title,
        password: password,
        isNewUser: isNewUser,
        isEmployee: isEmployee,
        organizationName: organization.name,
        url: inviteUrl,
        signURL: signURL
      }, function (err, emailHTML) {
        done(err, emailHTML, user, organization, invite);
      });
    },
    // If valid email, send reset email using service
    (emailHTML, user, organization, invite, done) => {
      var mailOptions = {
        to: `"${user.profile.firstName} ${user.profile.lastName}" <${user.email}>`,
        from: config.mailer.from,
        subject: isEmployee ? `Invite to ${organization.name}` : `Welcome on board at ${organization.name}`,
        html: emailHTML
      };
      mailer.sendMail(mailOptions, function (err) {
        if (err) {
          logger.error('Send mail: ', err);
        }
        done(null, user, invite);
      });
    }
  ], (err, user, invite) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    // for existing user
    if (isNewUser && user.toObject) {
      user = user.toObject();
    } else {
      // because it's still not a real user, only invite
      user._id = invite.newUserInfo._id;
    }

    user.password = undefined;
    user.salt = undefined;
    user = _.pick(user, 'profile.firstName', 'profile.lastName');
    return res.json(user);
  });

};

exports.checkUserExists = (req, res) => {
  const email = req.params.email;
  User.findOne({ email: email }).exec((err, user) => {
    if (err) {
      return res.status(501).send({ message: "Something went wrong" });
    }
    if (user) {
      return res.status(200).send({ message: "Email not usable", exist: true });
    }
    return res.status(200).send({ message: "email usable", exist: false });
  });
}

exports.updateStatus = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, { 'profile.status': req.body.status }).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({});
  });
}

exports.updateSecurity = (req, res) => {
  const { isEnabledLoginSecondFactorAuth } = req.body;
  User.findByIdAndUpdate(req.currentUser._id, { isEnabledLoginSecondFactorAuth }).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({});
  });
}

const getIp = (req) => {
  var ip = (req.headers && req.headers['x-forwarded-for']) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  return ip;
}

const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

/**
 * Sign up
 */
exports.signup = (req, res) => {

  const ip = getIp(req);

  let user = new User(_.pick(req.body, 'profile', 'email', 'password', 'services'));
  const password = req.body.password;

  if (!emailRegex.test(user.email)) {
    return res.status(422).send({
      message: 'Email is not valid'
    });
  }

  logger.info(`[signup] IP: ${ip}; email: ${user.email}`);
  async.waterfall([
    (done) => {
      const referralCode = req.body.referralCode;
      if (!referralCode) {
        done(null);
      } else {
        User.findOne({ referralCode: referralCode }).exec((err, referredUser) => {
          if (err) {
            return done(err);
          }
          if (!referredUser) {
            return done({ message: 'Referral code is not valid' });
          }
          user.referredByUser = referredUser;
          done();
        })
      }
    },

    (done) => {
      user.save((err, user) => {
        done(err, user);
      });
    },

    (user, done) => {
      broker.instance.call(`CREATORS_STUDIO.GiteaService.createUserSync`, { payload: { user, password } })
      .then(() => {
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
    },
    (user, done) => {

      // async create new gitea user


      let conditions = {
        'newUserInfo.email': user.email
      };

      OrganizationInvite.findOne(conditions).populate('organization').exec((err, invite) => {
        if (err) {
          return done(err);
        }
        if (!invite) {
          return done(err, user);
        }
        invite.newUserInfo = {}
        invite.user = user;
        let notification = new Notification({
          title: `Invite to ${invite.organization.name} organization`,
          user: user._id,
          actionType: 'organization-invite',
          actionData: {
            inviteId: invite._id.toString()
          }
        });
        invite.save((err) => {
          if (err) { return done(err); }

          notification.save((err, notification) => {
            done(err, user);
          });
        })


      });
    },
    /**
     * Render email
     */
    (user, done) => {

      var httpTransport = 'http://';
      if (config.secure) {
        httpTransport = 'https://';
      }
      var baseUrl = config.domain || httpTransport + req.headers.host;
      res.render(path.resolve('api/users/templates/welcome.html'), {
        subject: `Welcome to ${config.web.title}`,
        name: user.profile.firstName,
        appName: config.web.title
      }, function (err, emailHTML) {
        done(err, emailHTML, user);
      });
    },
    /**
     * Send mail
     */
    (emailHTML, user, done) => {
      var mailOptions = {
        to: `"${user.profile.firstName} ${user.profile.lastName}" <${user.email}>`,
        from: config.mailer.from,
        subject: `Welcome to ${config.web.title}`,
        html: emailHTML
      };
      mailer.sendMail(mailOptions, function (err) {
        if (err) {
          logger.error('Send mail: ', err);
        }
        done(null, user);
      });
    }
  ], async (err, user) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    await sendVerifyEmailAction(user);
    res.json(user);
  });
};

// sendKYCRequest = (user) => {
//   return new Promise((resolve, reject) => {

//     /**
//      * disabled for now
//      */

//     const authHeader = `Token ${config.KYC.apiKey}`;
//     const birthday = moment.utc(user.profile.birthday);

//     const reqBody = {
//       "search_term": {
//         "last_name": user.profile.lastName,
//         "first_name": user.profile.firstName
//       },
//       "fuzziness": 0,
//       "filters": {
//         "entity_type": "person",
//         "types": ["sanction", "warning", "fitness-probity"],
//         "birth_year": birthday.year()
//       },
//       "client_ref": user._id.toString()
//     };
//     request.post(config.KYC.url + '/searches', {
//       rejectUnauthorized: false,
//       headers: {
//         'Authorization': authHeader,
//         'Content-type': 'application/json',
//         'Cache-control': 'no-cache',
//       },
//       json: true,
//       body: reqBody
//     }, (err, response, body) => {
//       // init status
//       let status = 'Pending';
//       if (err) {
//         logger.error('[sendKYCRequest] request error:', reqBody, response && response.statusCode);
//         return reject(err);
//       }
//       if (response.statusCode != 200) {
//         logger.error('[sendKYCRequest] request error NOT 200:', reqBody, body);
//       } else {
//         // logger.debug('[sendKYCRequest] Success:', reqBody, body);
//         // result 200 so we must have a real status value
//         if (body && body.status === "success") {
//           // nothing found
//           // if (body.content.data.risk_level === "unknown" || body.content.data.risk_level === "low"){
//           //   status = 'Verified';
//           // }
//           // if (body.content.data.risk_level === "medium" || body.content.data.risk_level === "high"){
//           //   status = 'Denied';
//           // }

//           // if (body.content.data.total_hits > 0){
//           //   const hasExactlyMatch = body.content.data.hits.filter((h) => { return h.match_types.indexOf("name_exact") > -1 && h.match_types.indexOf("year_of_birth") > -1 });
//           //   status = 'Denied';
//           // }
//           status = 'Verified';
//           // match_status  string  One of 'no_match', 'false_positive', 'potential_match', 'true_positive','unknown'
//         }
//       }

//       resolve(status);
//     })
//   })
// }




/**
 * Update user
 */
exports.update = (req, res) => {
  let user = req.user || req.currentUser;

  if (!emailRegex.test(req.body.email)) {
    return res.status(422).send({
      message: 'Email is not valid'
    });
  }

  const birthday = moment(req.body.profile.birthday, 'YYYY-MM-DD');
  const birthdayValid = birthday.isBefore(moment.utc()) && birthday.isAfter(moment.utc('1900-01-01', 'YYYY-MM-DD'));
  if (!birthdayValid) {
    return res.status(400).send({
      message: 'Birthday not valid'
    });
  }

  async.waterfall([
    (done) => {
      User.findById({ _id: user._id }).exec(done);
    },
    (user, done) => {
      if (user.email.toLowerCase() != req.body.email.toLowerCase()) {
        policy.processSecondFactor(req, res, (err) => {
          sendVerifyEmailAction(user);
          user = _.extend(user, _.pick(req.body, 'email', 'profile', 'personal', 'professional', 'dating', 'disabled'));
          user.emailVerified = false;
          done(err, user);
        });
      } else {
        user = _.extend(user, _.pick(req.body, 'email', 'profile', 'personal', 'professional', 'dating', 'disabled'));
        done(null, user);
      }
    },
    (user, done) => {
      if (req.body.organizationRole) {
        const roleIndex = user.roles.findIndex((r) => r.organization == req.body.organizationRole.organization);
        if (roleIndex > -1) {
          user.roles[roleIndex] = req.body.organizationRole;
        }
      }
      user.save((err, user) => {
        if (err) {
          return done(err);
        } else {
          user.password = undefined;
          user.salt = undefined;
          done(err, user);
        }
      });
    }
  ], (err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(user);
  })

  User.findById({ _id: user._id }, (err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }




  });
};

/**
 * User middleware
 */
exports.userByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id).exec((err, user) => {
    if (err) {
      return next(err);
    } else if (!user) {
      return res.status(404).send({
        message: 'No User with that identifier has been found'
      });
    }
    req.user = user;
    next();
  });
};


/**
 * Invite middleware
 */
exports.inviteByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'InviteID is invalid'
    });
  }

  OrganizationInvite.findById(id).populate('user').exec((err, invite) => {
    if (err) {
      return next(err);
    } else if (!invite) {
      return res.status(201).send({message: "You have already accepted the invitation.", valid: true});
    }
    req.invite = invite;
    next();
  });
};

/**
 * Add service to current user
 */

exports.addService = (req, res) => {
  let serviceId = req.params.serviceId;

  let userId = req.query.userId || req.currentUser._id;

  User.findById(userId, (err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {

      if (user.services.filter((s) => { return s.toString() === serviceId; }).length > 0) {
        return res.json({});
      }

      user.update({ $push: { 'services': serviceId } }, (err, user) => {
        res.json({});
      });
    }
  });
};

exports.deleteService = (req, res) => {
  let serviceId = req.params.serviceId;

  User.findById(req.currentUser._id, (err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      user.update({ $pull: { 'services': serviceId } }, (err, user) => {
        res.json({});
      });
    }
  });
};

exports.updateDockService = (req, res) => {
  let dockServices = req.body.dockServices;
  let userId = req.currentUser._id;

  User.findOneAndUpdate({ _id: userId }, { 'dockServices': dockServices }).exec((err, user) => {
    if (err) return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
    return res.json({});
  });
};

/**
 * Add service to current user
 */
exports.addOrgService = (req, res) => {
  let serviceId = req.params.serviceId;
  let organizationId = req.params.organizationId;
  let userId = req.params.userId;

  User.findById(userId, (err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {

      let orgRole = user.roles.find((r) => { return r.organization.toString() === organizationId });
      if (!orgRole) {
        return res.status(422).send({
          message: 'No organization'
        });
      }
      let existService = orgRole.services.find((s) => { return s.service === serviceId });
      if (existService) {
        return res.json({});
      }

      orgRole.services.push({
        service: serviceId,
        role: 'User'
      })

      user.update({ $set: { 'roles': user.roles } }, (err, user) => {
        res.json({});
      })
    }
  });
};


/**
 * Search users by conditions
 */
exports.search = (req, res) => {
  let conditions = _.pick(req.body, 'email');
  User.find(conditions).limit(10).exec((err, users) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(users);
  })
}

/**
 * Search users by conditions
 */
exports.profileSearch = (req, res) => {
  const requestQuery = req.query['search'];
  if (!requestQuery || requestQuery == '') {
    res.json([]);
  }

  const query = `${decodeURIComponent(req.query['search'])}`;
  const searchArray = query.split(' ');
  const includeOrg = req.query.includeOrg || false;
  const onlyOrg = req.query.onlyOrg || false;
  let conditions = {
    $or: [
      {
        email: new RegExp('^' + query, 'i')
      },
      {
        'profile.firstName': new RegExp(searchArray[0], 'i')
      },
      {
        'profile.lastName': new RegExp(searchArray[0], 'i')
      },
      {
        'profile.phoneNumber': new RegExp(query, 'i')
      }
    ],
    'deleted': { $ne: true }
  };

  if (searchArray[1]) {
    conditions = {
      $or: [
        {
          $and: [{
            'profile.firstName': new RegExp(searchArray[0], 'i')
          },
          {
            'profile.lastName': new RegExp(searchArray[1], 'i')
          }]
        },
        {
          $and: [{
            'profile.firstName': new RegExp(searchArray[1], 'i')
          },
          {
            'profile.lastName': new RegExp(searchArray[0], 'i')
          }]
        },
      ],
      'deleted': { $ne: true }
    };
  }

  let command;
  const execCommand = (command) => {
    command.limit(10).exec((err, users) => {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(users);
    });
  }

  command = User.find(conditions, '_id profile.firstName profile.lastName profile.avatarUrl profile.phoneNumber profile.homeAddress profile.currentAddress emailRouting.emailPrefix');
  if (onlyOrg) {
    policy.processOrganization(req, res, () => {
      conditions['roles'] = { $elemMatch: { organization: req.currentOrganization } };
      command = User.find(conditions, '_id profile.firstName profile.lastName profile.avatarUrl emailRouting.emailPrefix');
      if (includeOrg) {
        command = command.populate('roles.organization', '_id name');
      }
      execCommand(command);
    })
    // conditions[]roles.organization
  } else {
    if (includeOrg) {
      command = command.populate('roles.organization', '_id name');
    }

    execCommand(command);
  }
}


/**
 * Search users by conditions
 */
exports.usersAndTeamsSearch = (req, res) => {
  const query = `.*${decodeURIComponent(req.query['q'])}.*`;
  async.parallel([
    (done) => {
      const includeOrg = req.query.includeOrg || false;
      let conditions = {
        $or: [
          {
            email: new RegExp('^' + query, 'i')
          },
          {
            'profile.firstName': new RegExp(query, 'i')
          },
          {
            'profile.lastName': new RegExp(query, 'i')
          }
        ],
        'deleted': { $ne: true }
      };

      let command;
      const execCommand = (command) => {
        command.limit(10).lean().exec((err, users) => {
          if (err) {
            return done(err);
          }
          users = users.map((u) => {
            u.name = u.profile.firstName + ' ' + u.profile.lastName;
            return u;
          })
          done(err, users);
        });
      }

      if (includeOrg) {
        command = command.populate('roles.organization', '_id name');
      }
      conditions['roles'] = { $elemMatch: { organization: req.currentOrganization } };
      command = User.find(conditions, '_id profile.firstName profile.lastName profile.avatarUrl');
      if (includeOrg) {
        command = command.populate('roles.organization', '_id name');
      }
      execCommand(command);
    },
    (done) => {
      Team.find({ organization: req.currentOrganization, name: new RegExp(query, 'i') }, '_id name').lean().exec((err, teams) => {
        if (err) {
          return done(err);
        }
        teams = teams.map((t) => {
          t.isTeam = true;
          return t;
        })
        done(err, teams);
      });
    }
  ], (err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(result[0].concat(result[1]));
  });

}


/**
 * Accept organization invite from email
 */
exports.acceptInvite = (req, res) => {

  let inviteId = req.params.inviteId;

  if (!mongoose.Types.ObjectId.isValid(inviteId)) {
    return res.render(path.resolve('./api/users/templates/invite-expired.html'))
  }

  OrganizationInvite.findById(inviteId).populate('user').populate('organization', 'domain').exec(async (err, invite) => {
    if (err) {
      return errorHandler.response(req, res, err);
    }
    if (!invite) {
      return res.render(path.resolve('./api/users/templates/invite-expired.html'))
    }

    try {
      await Task.deleteOne({ 'action.referenceId': inviteId }).exec();
    } catch (err) {
      logger.error('Delete task failed', err);
    }



    let renderOptions = {
      pageName: 'login',
      pageLink: '/login'
    };
    // if user logged in the we redirect him to dashboard page
    if (req.cookies && req.cookies['fl_token']) {
      renderOptions = {
        pageName: 'dashboard',
        pageLink: '/users',
      };
    }

    if (invite.isEmployee) {
      var httpTransport = 'http://';
      if (config.secure) {
        httpTransport = 'https://';
      }
      var baseUrl = `${invite.organization.domain}.${config.domain}`;
      renderOptions = {
        pageName: 'Documents signing',
        pageLink: `${httpTransport}${baseUrl}/hr/signing`,
      };
    }

    // existing user flow
    let user;
    if (invite.user) {
      user = invite.user;
    } else if (invite.newUserInfo && invite.newUserInfo.email) {
      try {
        user = await User.findOne({ email: invite.newUserInfo.email });
      } catch (err) {
        logger.error('[acceptInvite] Error during accept invite', err);
      }
    }
    user = user || new User(invite.newUserInfo.toObject());

    let role = invite.inviteAccess.toObject();
    role.organization = invite.organization;
    user.roles.push(role);

    // prevent generate hash from password because we already store it hashed in invite table
    user.ignoreHash = true;

    user.save((err, user) => {
      if (err) {
        return errorHandler.response(req, res, err);
      }

      broker.instance.call(`CREATORS_STUDIO.GiteaService.addOrgMemberSync`, { payload: { user: { _id: user._id.toString() }, organization: role.organization } })
      .then(() => {
        const isEmployee = invite.isEmployee;
        invite.remove((err) => {
          if (err) {
            return errorHandler.response(req, res, err);
          }
          return res.render(path.resolve('./api/users/templates/invite-success.html'), renderOptions);

        });
      })
      .catch((err) => {
        return errorHandler.response(req, res, err);
      });
    });
  });
}

/**
 * Accept user invite from notification
 */
exports.acceptInviteNotification = (req, res) => {
  let inviteId = req.params.inviteId;

  if (!mongoose.Types.ObjectId.isValid(inviteId)) {
    return errorHandler.response(req, res);
  }

  OrganizationInvite.findById(inviteId).populate('user').populate('organization', 'domain').exec((err, invite) => {
    if (err || !invite) {
      return errorHandler.response(req, res, err);
    }

    // existing user flow
    let user = invite.user ? invite.user : new User(invite.newUserInfo.toObject());
    let role = invite.inviteAccess.toObject();


    role.organization = invite.organization;
    user.roles.push(role);

    // prevent generate hash from password because we already store it hashed in invite table
    user.ignoreHash = true;

    user.save((err, user) => {
      if (err) {
        return errorHandler.response(req, res, err);
      }
      broker.instance.call(`CREATORS_STUDIO.GiteaService.addOrgMemberSync`, { payload: { user: { _id: user._id.toString() }, organization: role.organization } })
        .then(() => {
          const isEmployee = invite.isEmployee;
          invite.remove((err) => {
            if (err) {
              return errorHandler.response(req, res, err);
            }

            if (isEmployee) {
              res.redirect('/hr/signing');
            } else {
              return res.json({
                isEmployee: isEmployee
              });
            }
          });
        });
    })
      .catch((err) => {
        return errorHandler.response(req, res, err);
      });


  });
}

/**
 * Decline user invite from notification
 */
exports.declineInviteNotification = (req, res) => {
  let inviteId = req.params.inviteId;

  if (!mongoose.Types.ObjectId.isValid(inviteId)) {
    return errorHandler.response(req, res);
  }

  OrganizationInvite.findByIdAndRemove(inviteId).exec((err) => {
    if (err) {
      return errorHandler.response(req, res, err);
    }
    return res.json({});
  });
}

exports.uploadAvatar = (req, res) => {
  // create a folder temp.
  var dir = './temp';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  uploadToTempDirectory(req, res, (err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err) || err
      });
    }

    let file = req.file;
    const imagePath = path.join(__dirname + '/../../temp/');

    const fname = req.file.originalname;
    const filePath = imagePath + file.filename;

    // get access to Aitheon DRIVE
    const userId = req.currentUser._id;
    const token = policy.getTokenFromRequest(req);
    let acl_url = `${config.driveURI}/api/acl`;
    let opt = {
      url: acl_url,
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `JWT ${token}`
      },
      json: true,
      body: {
        'level': 'FULL',
        'user': userId,
        'service': {
          '_id': 'USERS',
          'key': userId,
          'keyName': ''
        },
        'public': true
      }
    };
    externalRequest(opt, function (error, response, body) {

      if (error) {
        // DRIVE Access Denied / Request Error
        return res.status(422).send({
          message: errorHandler.getErrorMessage(error) || error
        });
      }

      if (response != null && response.statusCode == 200) {
        // GOT DRIVE PERMISSION. NOW RESIZE IMAGES AND UPLOAD

        // Use sharp to get the saved uploaded avatar and resize for profile image
        const profileImageFileName = userId + '-' + '200' + '.jpg';
        const profileImagePath = imagePath + profileImageFileName;
        sharp(imagePath + file.filename)
          .resize(200, 200, {
            fit: sharp.fit.inside
          })
          .toFile(profileImagePath)
          .then(data => {
            // RESIZE COMPLETED. UPLOAD TO DRIVE
            const url = `${config.driveURI}/api/documents?isPublic=true&signedUrlExpire=315569520`;
            const options = {
              url: url,
              method: 'POST',
              headers: {
                'Authorization': `JWT ${token}`
              },
              formData: {
                name: profileImageFileName,
                service: JSON.stringify({
                  "_id": "USERS",
                  "key": userId
                }),
                file: {
                  value: fs.createReadStream(profileImagePath),
                  options: {
                    filename: profileImageFileName
                  }
                }
              }
            };
            externalRequest(options, function (error, response, body) {
              //COMPLETED UPLOAD. NOW DELETE LOCAL FILE
              fs.unlink(profileImagePath, function (err) {
                if (err) {
                  console.log(err);
                }
              });
              if (error) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(error) || error
                });
              }
              if (response != null && response.statusCode == 200) {
                const jsonResponse = JSON.parse(body);
                let avatar = {
                  fileStoreKey: jsonResponse.storeKey,
                  contentType: jsonResponse.contentType,
                  size: jsonResponse.size
                };
                let avatarUrl = jsonResponse.signedUrl + `&refresh=${new Date().getTime()}`;

                // save to db.
                User.findByIdAndUpdate(userId, { avatar: avatar, 'avatarResolutions.profile': avatar, 'profile.avatarUrl': avatarUrl, 'profile.avatarResolutions.profile': avatarUrl }).exec((err, user) => {
                  if (err) {
                    return res.status(422).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  }

                  // CREATED PROFILE IMAGE. NOW CREATE REST OF THE SIZES
                  cropAndUpdateImageUrl(token, file.filename, fname, imagePath, userId, filePath);

                  res.json({
                    updatedAt: user.updatedAt.toString(),
                    profile: {
                      avatarUrl: avatarUrl
                    }
                  });
                });

              }
              else {
                return res.status(422).send({
                  message: "Error"
                });
              }
            });
          })
          .catch(err => {
            //delete file.
            fs.unlink(imagePath + userId + '-' + '200' + '.jpg', function (err) {
            });
            return res.status(422).send({
              message: "Error"
            });
          });
      }
      else {
        return res.status(422).send({
          message: "Not authenticated"
        });
      }
    });

  });
}

// CROP the uploaded image to desired sizes
// UPLOAD the cropped image to DRIVE
// UPDATE database records
const cropAndUpdateImageUrl = (token, file_filename, ofname, imagePath, userId, ofilePath) => {
  // upload original image.
  // crop images and update to db.
  // 200-profile, 100-thumbnail, 50-mini, 20-micro
  var sizes = [100, 50, 20];

  const resize = size => sharp(imagePath + file_filename)
    .resize(size, size, {
      fit: sharp.fit.inside
    })
    .toFile(imagePath + userId + '-' + size + '.jpg')
    .then(data => { });

  Promise
    .all(sizes.map(resize))
    .then(() => {
      updateImageUrl('Micro', token, ofname, imagePath, userId, ofilePath);
      updateImageUrl('Mini', token, ofname, imagePath, userId, ofilePath);
      updateImageUrl('Thumbnail', token, ofname, imagePath, userId, ofilePath);
      updateImageUrl('Original', token, ofname, "", userId, ofilePath);
    });
}

// To update micro image url.
const updateImageUrl = (type, token, fileName, imagePath, userId, originalFilePath) => {
  let filePath = '';
  if (type == 'Micro') {
    filePath = imagePath + userId + '-' + '20' + '.jpg';
  }
  else if (type == 'Mini') {
    filePath = imagePath + userId + '-' + '50' + '.jpg';
  }
  else if (type == 'Thumbnail') {
    filePath = imagePath + userId + '-' + '100' + '.jpg';
  }
  else if (type == 'Original') {
    filePath = originalFilePath;
  }

  const url = `${config.driveURI}/api/documents?isPublic=true&signedUrlExpire=315569520`;
  const options = {
    url: url,
    method: 'POST',
    headers: {
      'Authorization': `JWT ${token}`
    },
    formData: {
      name: fileName,
      service: JSON.stringify({
        "_id": "USERS",
        "key": userId
      }),
      file: {
        value: fs.createReadStream(filePath),
        options: {
          filename: fileName
        }
      }
    }
  };

  externalRequest(options, function (error, response, body) {
    // delete file.
    if (type != 'Original') {
      fs.unlink(filePath, function (err) {
      });
    }
    if (error) {
      return;
    }
    if (response != null && response.statusCode == 200) {
      const jsonResponse = JSON.parse(body);
      const imageData = {
        fileStoreKey: jsonResponse.storeKey,
        contentType: jsonResponse.contentType,
        size: jsonResponse.size
      }
      const imageUrl = jsonResponse.signedUrl + `&refresh=${new Date().getTime()}`;
      if (type == 'Micro') {
        User.findByIdAndUpdate(userId, { 'avatarResolutions.micro': imageData, 'profile.avatarResolutions.micro': imageUrl }).exec((err, user) => {
          //deleteTempFile(ofilePath);
        });
      }
      else if (type == 'Mini') {
        User.findByIdAndUpdate(userId, { 'avatarResolutions.mini': imageData, 'profile.avatarResolutions.mini': imageUrl }).exec((err, user) => {
          //deleteTempFile(ofilePath);
        });
      }
      else if (type == 'Thumbnail') {
        User.findByIdAndUpdate(userId, { 'avatarResolutions.thumbnail': imageData, 'profile.avatarResolutions.thumbnail': imageUrl }).exec((err, user) => {
          //deleteTempFile(ofilePath);
        });
      }
      else if (type == 'Original') {
        User.findByIdAndUpdate(userId, { 'avatarResolutions.original': imageData, 'profile.avatarResolutions.original': imageUrl }).exec((err, user) => {
          //deleteTempFile(filePath);
        });
      }
    }
  });
  deleteTempFile(originalFilePath);
}

const deleteTempFile = (filePath) => {
  fs.unlink(filePath, function (err) {
    if (err) {
      console.log("Error occured while deleting file");
    }
  });
}

exports.publicProfile = (req, res) => {
  let result = _.pick(req.user, '_id', 'profile', 'personal', 'professional', 'dating', 'email', 'permissions', 'instagram_account', 'flickr_account', 'youtube_account');
  if (result.instagram_account && result.instagram_account.access_token && result.instagram_account.access_token.trim() != '') {
    result.instagram_account = true;
  }
  else {
    result.instagram_account = false;
  }
  if (result.flickr_account) {
    result.flickr_account = true;
  }
  else {
    result.flickr_account = false;
  }
  if (result.youtube_account && result.youtube_account.refresh_token && result.youtube_account.refresh_token.trim() != '') {
    result.youtube_account = true;
  }
  else {
    result.youtube_account = false;
  }
  res.json(result);
}

exports.read = (req, res) => {
  let result = _.pick(req.user, '_id', 'email', 'profile', 'roles', 'services', 'avatar', 'sysadmin', 'disabled', 'emailRouting');
  res.json(result);
}


exports.getTelegramLink = (req, res) => {
  const telegramKey = shortid.generate();
  cache.put(`telegram_${telegramKey}`, req.currentUser._id.toString(), 60 * 1000);
  const url = `${config.telegram.botUrl}/?start=${telegramKey}`;
  res.redirect(302, url);
}

exports.unlinkTelegram = (req, res) => {
  User.update({ _id: req.currentUser._id }, {
    $unset: {
      'profile.telegram': ''
    }
  }).exec((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.sendStatus(204);
  })
}

exports.getAvatar = (req, res) => {
  User.findById(req.currentUser._id, 'profile.avatarUrl').lean().exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (user && user.profile && user.profile.avatarUrl) {
      return res.redirect(302, user.profile.avatarUrl);
    }
    return res.redirect(302, '/users/assets/img/nophoto.png');

  })
}

exports.changeNotifications = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, { unsubscribedEmail: req.body.unsubscribedEmail }).exec((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    return res.sendStatus(204);
  })
}

exports.unsubscribeEmail = (req, res) => {
  const token = req.params.unsubscribeToken;
  if (!token) {
    return res.redirect('/unsubscribed?error=notoken');
  }

  jwt.verify(token, config.unsubscribedEmailSecret, (err, decoded) => {
    if (err) {
      return res.redirect('/unsubscribed?error=true');
    }
    User.findById(decoded.user).exec((err, user) => {
      if (err) {
        return res.redirect('/unsubscribed?error=true');
      }
      if (!user) {
        return res.redirect('/unsubscribed');
      }
      user.unsubscribedEmail = true;
      user.save((err) => {
        return res.redirect(err ? '/unsubscribed?error=true' : '/unsubscribed');
      })
    });
  });
}

exports.sendVerifyEmail = async (req, res) => {
  try {
    if (req.currentUser.verifyEmailSecret) {
      return res.status(422).send({
        message: 'Email already verified'
      });
    }
    await sendVerifyEmailAction(req.currentUser);
    res.sendStatus(204);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const token = req.params.token;
    const decoded = jwt.verify(token, config.verifyEmailSecret);
    const user = await User.findById(decoded.user);
    if (!user) {
      return res.sendStatus(404);
    }
    user.emailVerified = true;
    await user.save();
    const isLoggedIn = policy.getTokenFromRequest(req);
    res.render(path.resolve('api/users/templates/verify-email.success.html'), {
      pageName: isLoggedIn ? 'Dashboard' : 'Login',
      pageLink: isLoggedIn ? '/users' : '/login'
    })
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
}

const sendVerifyEmailAction = async (user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const verifyToken = jwt.sign({ user: user._id.toString() }, config.verifyEmailSecret);

      const verifyEmailLink = `https://${config.domain}/users/api/users/verify-email/${verifyToken}`;
      fs.readFile(path.resolve('api/users/templates/verify-email.html'), 'utf-8', async (err, htmlContent) => {
        if (err) {
          throw new Error(err);
        }
        const template = handlebars.compile(htmlContent);

        const subject = 'Aitheon - Confirm your email address';
        const emailHTML = await template({
          subject: subject,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          verifyEmailLink: verifyEmailLink,
          appName: config.web.title
        });

        var mailOptions = {
          to: `"${user.profile.firstName} ${user.profile.lastName}" <${user.email}>`,
          from: config.mailer.from,
          subject: subject,
          html: emailHTML
        };
        await mailer.sendMail(mailOptions);

        resolve();
      });

    } catch (err) {
      reject(err);
    }
  });
}


exports.showDevicesPin = async (req, res) => {
  try {
    policy.processSecondFactor(req, res, async (err) => {
      try {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        const user = await User.findById(req.currentUser._id);
        res.json(user.devicesPin);

      } catch (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

    });
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    policy.processSecondFactor(req, res, async (err) => {
      try {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        const user = req.currentUser;
        await User.updateOne({ _id: user._id }, { deleted: true });
        res.sendStatus(204);

        res.render(path.resolve('api/users/templates/account-deleted.html'), {
          subject: `Welcome to ${config.web.title}`,
          name: user.profile.firstName,
          appName: config.web.title
        }, (err, emailHTML) => {
          var mailOptions = {
            to: `"${user.profile.firstName} ${user.profile.lastName}" <${user.email}>`,
            from: config.mailer.from,
            subject: `Account deleted`,
            html: emailHTML
          };
          mailer.sendMail(mailOptions, (err) => {
            if (err) {
              logger.error('Send mail: ', err);
            }
          });
        });
      } catch (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

    });
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
}

exports.profileDetail = (req, res) => {
  User.findById(req.currentUser._id).lean().exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    return res.json(user);
  })
}

exports.uploadCoverImage = (req, res) => {
  let profileTypeId = req.params.profileTypeId;

  // Personal = 1, Professional = 2, Dating = 3
  if (profileTypeId !== "1" && profileTypeId !== "2" && profileTypeId !== "3") {
    return res.status(422).send({
      message: 'Invalid Profile Type'
    });
  }

  // create a folder temp.
  var dir = './temp';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  uploadToTempDirectory(req, res, (err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err) || err
      });
    }
    let filename = "";
    // if the profile type is personal
    if (profileTypeId === "1") {
      filename = 'personalCover';
    } else if (profileTypeId === "2") { // if the profile type is professional
      filename = 'professionalCover';
    } else if (profileTypeId === "3") { // if the profile type is dating
      filename = 'datingCover'
    }
    let file = req.file;
    const imagePath = path.join(__dirname + '/../../temp/');

    const fname = req.file.originalname;
    const filePath = imagePath + file.filename;
    let userId = req.currentUser._id;
    // get access to Aitheon DRIVE
    const token = policy.getTokenFromRequest(req);
    let acl_url = `${config.driveURI}/api/acl`;
    let opt = {
      url: acl_url,
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `JWT ${token}`
      },
      json: true,
      body: {
        'level': 'FULL',
        'user': userId,
        'service': {
          '_id': 'USERS',
          'key': userId,
          'keyName': ''
        },
        'public': true
      }
    };
    externalRequest(opt, function (error, response, body) {

      if (error) {
        // DRIVE Access Denied / Request Error
        return res.status(422).send({
          message: errorHandler.getErrorMessage(error) || error
        });
      }

      if (response != null && response.statusCode == 200) {
        // GOT DRIVE PERMISSION.
        // UPLOAD TO DRIVE
        const url = `${config.driveURI}/api/documents?isPublic=true&signedUrlExpire=315569520`;
        let userId = req.currentUser._id;
        const options = {
          url: url,
          method: 'POST',
          headers: {
            'Authorization': `JWT ${token}`
          },
          formData: {
            name: fname,
            service: JSON.stringify({
              "_id": "USERS",
              "key": userId
            }),
            file: {
              value: fs.createReadStream(filePath),
              options: {
                filename: fname
              }
            }
          }
        };
        externalRequest(options, function (error, response, body) {
          //COMPLETED UPLOAD. NOW DELETE LOCAL FILE
          //   fs.unlink(profileImagePath, function (err) {
          //     if(err){
          //     console.log(err);}
          //   });
          if (error) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(error) || error
            });
          }
          if (response != null && response.statusCode == 200) {
            const jsonResponse = JSON.parse(body);
            let coverImage = {
              fileStoreKey: jsonResponse.storeKey,
              contentType: jsonResponse.contentType,
              size: jsonResponse.size
            };
            let coverImageUrl = jsonResponse.signedUrl + `&refresh=${new Date().getTime()}`;

            // if the profile type is personal
            if (profileTypeId === "1") {
              updateContent = { personalCoverImage: coverImage, 'personal.coverImageUrl': coverImageUrl };
            } else if (profileTypeId === "2") { // if the profile type is professional
              updateContent = { professionalCoverImage: coverImage, 'professional.coverImageUrl': coverImageUrl };
            } else if (profileTypeId === "3") { // if the profile type is dating
              updateContent = { datingCoverImage: coverImage, 'dating.coverImageUrl': coverImageUrl };
            }

            User.findByIdAndUpdate(userId, updateContent).exec((err, user) => {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              }
              res.json({
                updatedAt: user.updatedAt.toString(),
                coverImageUrl: coverImageUrl
              });
            });
          }
          else {
            return res.status(422).send({
              message: "Error"
            });
          }
        });
      }
    });
  });
}

/// to remove user avatar url.
exports.removeAvatar = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, { avatar: undefined, 'profile.avatarUrl': '' }).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json({
      updatedAt: user.updatedAt.toString(),
      profile: {
        avatarUrl: ''
      }
    });
  });
}

exports.updateIntro = (req, res) => {
  let profileTypeId = req.params.profileTypeId;

  // Personal = 1, Professional = 2, Dating = 3
  if (profileTypeId !== "1" && profileTypeId !== "2" && profileTypeId !== "3") {
    return res.status(422).send({
      message: 'Invalid Profile Type'
    });
  }

  let updateContent = {};

  // if the profile type is personal
  if (profileTypeId === "1") {
    updateContent = { 'personal.intro': req.body.intro, 'personal.introBackgroundStyle': req.body.introBackgroundStyle, 'personal.introTextStyle': req.body.introTextStyle };
  } else if (profileTypeId === "2") { // if the profile type is professional
    updateContent = { 'professional.intro': req.body.intro, 'professional.introBackgroundStyle': req.body.introBackgroundStyle, 'professional.introTextStyle': req.body.introTextStyle };
  } else if (profileTypeId === "3") { // if the profile type is dating
    updateContent = { 'dating.intro': req.body.intro, 'dating.introBackgroundStyle': req.body.introBackgroundStyle, 'dating.introTextStyle': req.body.introTextStyle };
  }

  User.findByIdAndUpdate(req.currentUser._id, updateContent).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    // console.log('updatedAt', user.updatedAt.toString());
    res.json({
      updatedAt: user.updatedAt.toString(),
    });
  });
}

/// to remove user cover image url.
exports.removeCoverImage = (req, res) => {
  let profileTypeId = req.params.profileTypeId;

  // Personal = 1, Professional = 2, Dating = 3
  if (profileTypeId !== "1" && profileTypeId !== "2" && profileTypeId !== "3") {
    return res.status(422).send({
      message: 'Invalid Profile Type'
    });
  }

  let updateContent = {};

  // if the profile type is personal
  if (profileTypeId === "1") {
    updateContent = { personalCoverImage: undefined, 'personal.coverImageUrl': '' };
  } else if (profileTypeId === "2") { // if the profile type is professional
    updateContent = { professionalCoverImage: undefined, 'professional.coverImageUrl': '' };
  } else if (profileTypeId === "3") { // if the profile type is dating
    updateContent = { datingCoverImage: undefined, 'dating.coverImageUrl': '' };
  }

  User.findByIdAndUpdate(req.currentUser._id, updateContent).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({
      updatedAt: user.updatedAt.toString(),
      coverImageUrl: ''
    });
  });
}

exports.updatePermissions = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, { permissions: req.body.permissions }).exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({
      updatedAt: user.updatedAt.toString(),
    });
  });
}

exports.getFollowingOrganizations = (req, res) => {
  let userId = req.params.userId;
  OrganizationFollowers.find({ user: userId }).populate('org').exec((err, organizationDetails) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(organizationDetails);
  });
}

exports.getExperience = (req, res) => {
  let userId = req.params.userId;
  User.findById(userId, 'profile.experience').populate('profile.experience.org').exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (user && user.profile && user.profile.experience) {
      return res.json(user.profile.experience);
    }
    return res.json([]);
  });
}

exports.addExperience = (req, res) => {
  const experience = req.body;
  if (experience && experience.org._id == undefined) {
    const orgDomain = experience.org.name.replace(/ /g, "_");

    // creating new organization with required fields "UNIDENTIFIED" value for tempropary usage
    const organization = {
      name: experience.org.name,
      domain: urlSlug(orgDomain),
      address: {
        line1: experience.addressLine1 || "UNIDENTIFIED",
        line2: experience.addressLine2 || "UNIDENTIFIED",
        city: "UNIDENTIFIED",
        state: "UNIDENTIFIED",
        zip: "UNIDENTIFIED",
        country: "UNIDENTIFIED"
      },
      primaryPhone: "UNIDENTIFIED",
      profile: {
        avatarUrl: experience.uploadFile
      }
    }

    let organizationSchema = new Organization(organization);
    organizationSchema.save((err, orgCreateResponse) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || error
        });
      } else {
        if (orgCreateResponse && orgCreateResponse._id) {
          experience.org = orgCreateResponse;
          User.findByIdAndUpdate({ _id: req.currentUser._id }, { $push: { 'profile.experience': req.body } }, { new: true }).populate('profile.experience.org').exec((err, user) => {
            if (err) {
              return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
              });
            }
            res.json(user.profile.experience[user.profile.experience.length - 1]);
          });
        }
        else {
          return res.status(422).send({
            message: 'Couldn\'t create create organization'
          });
        }
      }
    });
  }
  else {
    User.findByIdAndUpdate({ _id: req.currentUser._id }, { $push: { 'profile.experience': req.body } }, { new: true }).populate('profile.experience.org').exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(user.profile.experience[user.profile.experience.length - 1]);
    });
  }
}

exports.updateExperience = (req, res) => {
  const experience = req.body;
  if (experience && experience.org._id == undefined) {
    const orgDomain = experience.org.name.replace(/ /g, "_");
    const organization = {
      name: experience.org.name,
      domain: urlSlug(orgDomain),
      address: {
        line1: experience.addressLine1 || "UNIDENTIFIED",
        line2: experience.addressLine2 || "UNIDENTIFIED",
        city: "UNIDENTIFIED",
        state: "UNIDENTIFIED",
        zip: "UNIDENTIFIED",
        country: "UNIDENTIFIED"
      },
      primaryPhone: "UNIDENTIFIED",
      profile: {
        avatarUrl: experience.uploadFile
      }
    }
    let organizationSchema = new Organization(organization);
    organizationSchema.save((err, orgCreateResponse) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || error
        });
      }
      else {
        if (orgCreateResponse && orgCreateResponse._id) {
          experience.org = orgCreateResponse;
          User
            .update(
              { _id: req.currentUser._id, 'profile.experience._id': req.body._id },
              { $set: { "profile.experience.$": req.body } })
            .exec((err, user) => {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              }
              User.findById(req.currentUser._id).populate('profile.experience.org').exec((err, user) => {
                const index = user.profile.experience.findIndex(item => item._id == req.body._id);
                res.json(user.profile.experience[index]);
              })
            });
        }
        else {
          return res.status(422).send({
            message: 'Couldn\'t create organization'
          });
        }
      }
    });
  }
  else {
    User
      .update(
        { _id: req.currentUser._id, 'profile.experience._id': req.body._id },
        { $set: { "profile.experience.$": req.body } })
      .exec((err, user) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        User.findById(req.currentUser._id).populate('profile.experience.org').exec((err, user) => {
          const index = user.profile.experience.findIndex(item => item._id == req.body._id);
          res.json(user.profile.experience[index]);
        })
      });
  }
}

exports.deleteExperience = (req, res) => {
  User
    .update(
      { _id: req.currentUser._id },
      { $pull: { "profile.experience": { _id: req.params.experienceId } } })
    .exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json({});
    });
}

exports.getLicence = (req, res) => {
  let userId = req.params.userId;
  User.findById(userId, 'profile.licence').populate('profile.licence.org').exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (user && user.profile && user.profile.licence) {
      return res.json(user.profile.licence);
    }
    return res.json([]);
  });
}

exports.addLicence = (req, res) => {
  const licence = req.body;
  if (licence && licence.org._id == undefined) {
    const orgDomain = licence.org.name.replace(/ /g, "_");
    const organization = {
      name: licence.org.name,
      domain: urlSlug(orgDomain),
      address: {
        line1: licence.addressLine1 || "UNIDENTIFIED",
        line2: licence.addressLine2 || "UNIDENTIFIED",
        city: "UNIDENTIFIED",
        state: "UNIDENTIFIED",
        zip: "UNIDENTIFIED",
        country: "UNIDENTIFIED"
      },
      primaryPhone: "UNIDENTIFIED",
      profile: {
        avatarUrl: licence.uploadFile
      }
    }
    let organizationSchema = new Organization(organization);
    organizationSchema.save((err, orgCreateResponse) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || error
        });
      }
      else {
        if (orgCreateResponse && orgCreateResponse._id) {
          licence.org = orgCreateResponse;
          User.findByIdAndUpdate({ _id: req.currentUser._id }, { $push: { 'profile.licence': req.body } }, { new: true }).populate('profile.licence.org').exec((err, user) => {
            if (err) {
              return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
              });
            }
            res.json(user.profile.licence[user.profile.licence.length - 1]);
          });
        }
        else {
          return res.status(422).send({
            message: 'Couldn\'t create create organization'
          });
        }
      }
    });
  }
  else {
    User.findByIdAndUpdate({ _id: req.currentUser._id }, { $push: { 'profile.licence': req.body } }, { new: true }).populate('profile.licence.org').exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(user.profile.licence[user.profile.licence.length - 1]);
    });
  }
}

exports.updateLicence = (req, res) => {
  const licence = req.body;
  if (licence && licence.org._id == undefined) {
    const orgDomain = licence.org.name.replace(/ /g, "_");
    const organization = {
      name: licence.org.name,
      domain: urlSlug(orgDomain),
      address: {
        line1: licence.addressLine1 || "UNIDENTIFIED",
        line2: licence.addressLine2 || "UNIDENTIFIED",
        city: "UNIDENTIFIED",
        state: "UNIDENTIFIED",
        zip: "UNIDENTIFIED",
        country: "UNIDENTIFIED"
      },
      primaryPhone: "UNIDENTIFIED",
      profile: {
        avatarUrl: licence.uploadFile
      }
    }
    let organizationSchema = new Organization(organization);
    organizationSchema.save((err, orgCreateResponse) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || error
        });
      }
      else {
        licence.org = orgCreateResponse;
        if (orgCreateResponse && orgCreateResponse._id) {
          User
            .update(
              { _id: req.currentUser._id, 'profile.licence._id': req.body._id },
              { $set: { "profile.licence.$": req.body } })
            .exec((err, user) => {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              }
              User.findById(req.currentUser._id).populate('profile.licence.org').exec((err, user) => {
                const index = user.profile.licence.findIndex(item => item._id == req.body._id);
                res.json(user.profile.licence[index]);
              })
            });
        }
        else {
          return res.status(422).send({
            message: 'Couldn\'t create create organization'
          });
        }

      }
    });
  }
  else {
    User
      .update(
        { _id: req.currentUser._id, 'profile.licence._id': req.body._id },
        { $set: { "profile.licence.$": req.body } })
      .exec((err, user) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        User.findById(req.currentUser._id).populate('profile.licence.org').exec((err, user) => {
          const index = user.profile.licence.findIndex(item => item._id == req.body._id);
          res.json(user.profile.licence[index]);
        })
      });
  }
}

exports.deleteLicence = (req, res) => {
  User
    .update(
      { _id: req.currentUser._id },
      { $pull: { "profile.licence": { _id: req.params.licenceId } } })
    .exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json({});
    });
}

exports.getEducation = (req, res) => {
  let userId = req.params.userId;
  User.findById(userId, 'profile.education').populate('profile.education.org').exec((err, user) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (user && user.profile && user.profile.education) {
      return res.json(user.profile.education);
    }
    return res.json([]);
  });
}

exports.addEducation = (req, res) => {
  const education = req.body;
  if (education && education.org._id == undefined) {
    const orgDomain = education.org.name.replace(/ /g, "_");
    const organization = {
      name: education.org.name,
      domain: urlSlug(orgDomain),
      address: {
        line1: education.addressLine1 || "UNIDENTIFIED",
        line2: education.addressLine2 || "UNIDENTIFIED",
        city: "UNIDENTIFIED",
        state: "UNIDENTIFIED",
        zip: "UNIDENTIFIED",
        country: "UNIDENTIFIED"
      },
      primaryPhone: "UNIDENTIFIED",
      profile: {
        avatarUrl: education.uploadFile
      }
    }
    let organizationSchema = new Organization(organization);
    organizationSchema.save((err, orgCreateResponse) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || error
        });
      }
      else {
        if (orgCreateResponse && orgCreateResponse._id) {
          education.org = orgCreateResponse;
          User.findByIdAndUpdate({ _id: req.currentUser._id }, { $push: { 'profile.education': req.body } }, { new: true }).populate('profile.education.org').exec((err, user) => {
            if (err) {
              return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
              });
            }
            res.json(user.profile.education[user.profile.education.length - 1]);
          });
        }
        else {
          return res.status(422).send({
            message: 'Couldn\'t create create organization'
          });
        }
      }
    });
  }
  else {
    User.findByIdAndUpdate({ _id: req.currentUser._id }, { $push: { 'profile.education': req.body } }, { new: true }).populate('profile.education.org').exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(user.profile.education[user.profile.education.length - 1]);
    });
  }
}

exports.updateEducation = (req, res) => {
  const education = req.body;
  if (education && education.org._id == undefined) {
    const orgDomain = education.org.name.replace(/ /g, "_");
    const organization = {
      name: education.org.name,
      domain: urlSlug(orgDomain),
      address: {
        line1: education.addressLine1 || "UNIDENTIFIED",
        line2: education.addressLine2 || "UNIDENTIFIED",
        city: "UNIDENTIFIED",
        state: "UNIDENTIFIED",
        zip: "UNIDENTIFIED",
        country: "UNIDENTIFIED"
      },
      primaryPhone: "UNIDENTIFIED",
      profile: {
        avatarUrl: education.uploadFile
      }
    }
    let organizationSchema = new Organization(organization);
    organizationSchema.save((err, orgCreateResponse) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || error
        });
      }
      else {
        if (orgCreateResponse && orgCreateResponse._id) {
          education.org = orgCreateResponse;
          User
            .update(
              { _id: req.currentUser._id, 'profile.education._id': req.body._id },
              { $set: { "profile.education.$": req.body } })
            .exec((err, user) => {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              }
              User.findById(req.currentUser._id).populate('profile.education.org').exec((err, user) => {
                const index = user.profile.education.findIndex(item => item._id == req.body._id);
                res.json(user.profile.education[index]);
              })
            });
        }
        else {
          return res.status(422).send({
            message: 'Couldn\'t create create organization'
          });
        }
      }
    });
  }
  else {
    User
      .update(
        { _id: req.currentUser._id, 'profile.education._id': req.body._id },
        { $set: { "profile.education.$": req.body } })
      .exec((err, user) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        User.findById(req.currentUser._id).populate('profile.education.org').exec((err, user) => {
          const index = user.profile.education.findIndex(item => item._id == req.body._id);
          res.json(user.profile.education[index]);
        })
      });
  }
}

exports.deleteEducation = (req, res) => {
  User
    .update(
      { _id: req.currentUser._id },
      { $pull: { "profile.education": { _id: req.params.educationId } } })
    .exec((err, user) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json({});
    });
}

// RoutingEmail
exports.updateRoutingMail = (req, res) => {
  User.findByIdAndUpdate({ _id: req.body.id }, { 'emailRouting.emailPrefix': req.body.nickmail }).exec((err, user) => {
    if (err) {
      console.log('error');
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({ 'success': 'Email alias updated Successfully' });
  });
}

// Process onboarding
// currently we are updating only the services, this will change

exports.processOnBoarding = (req, res) => {
  const user = req.user || req.currentUser;
  const services = req.body.services;
  const userTypes = req.body.userTypes
  const servicesToPush = [];
  Widget.deleteMany({ user: user._id }).exec();
  DashboardSettings.deleteMany({ user: user._id }).exec();



  services.forEach(service => {
    if (!user.services.includes(service)) {
      servicesToPush.push(service);
    }
  });

  User.updateOne({ _id: user._id }, {
    $push: { 'services': { $each: servicesToPush } },
    onBoarded: true,
    type: userTypes
  },
    { upsert: true },
    (err, data) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      return res.status(200).send({});
    });
}

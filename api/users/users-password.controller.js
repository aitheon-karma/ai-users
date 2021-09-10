/**
 * Module dependencies.
 */
const _ = require('lodash'),
    express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    errorHandler = require('../core/errors.controller'),
    logger = require('../core/logger'),
    policy = require('../core/policy.controller'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    broker = require('../broker'),
    config = require(path.resolve('./config')),
    mailer = require('../core/mailer');

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = (req, res) => {
  async.waterfall([
    // Generate random token
    (done) => {
      crypto.randomBytes(20, function (err, buffer) {
        var token = buffer.toString('hex');
        done(err, token);
      });
    },
    // Lookup user by username
    (token, done) => {
      if (req.body.email) {

        User.findOne({
          email: req.body.email
        }, '-salt -password', (err, user) => {
          if (err || !user) {
            return res.status(400).send({
              message: 'The email address you entered was not found.'
            });
          } else {
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save((err) => {
              done(err, token, user);
            });
          }
        });
      } else {
        return res.status(422).send({
          message: 'Email field must not be blank'
        });
      }
    },
    (token, user, done) => {

      var httpTransport = 'http://';
      if (config.secure) {
        httpTransport = 'https://';
      }
      const baseUrl = config.domain  ? (httpTransport + config.domain) :  httpTransport + req.headers.host;
      const url = baseUrl + '/users/api/users/reset-password/' + token;
      console.log(url);
      res.render(path.resolve('api/users/templates/reset-password-email.html'), {
        subject: 'Password Reset',
        firstName: user.profile.firstName,
        appName: config.web.title,
        url: url
      }, function (err, emailHTML) {
        done(err, emailHTML, user);
      });
    },
    // If valid email, send reset email using service
    (emailHTML, user, done) => {
      var mailOptions = {
        to: `"${user.profile.firstName} ${user.profile.lastName}" <${user.email}>`,
        from: config.mailer.from,
        subject: 'Password Reset',
        html: emailHTML
      };
      mailer.sendMail(mailOptions, (err) => {
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      logger.error('[forgot password] error:', err);
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.sendStatus(201);
  });
};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = function (req, res) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (err || !user) {
      return res.redirect('/users/password/reset/invalid');
    }

    res.redirect('/users/password/reset/' + req.params.token);
  });
};

/**
 * Reset password POST from email token
 */
exports.reset = (req, res) => {
  // Init Variables
  var passwordDetails = req.body;

  async.waterfall([

    (done) => {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, (err, user) => {
        if (!err && user) {
          user.password = passwordDetails.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          // async create new gitea user
          broker.instance.emit(`GiteaService.changePassword`, { user: _.pick(user, ['_id', 'profile', 'email']), password: user.password }, [`CREATORS_STUDIO${config.environment === 'production' ? '' : '_DEV'}`]);

          user.save((err) =>{
            done(err, user);
          });
        } else {
          return res.status(400).send({
            message: 'Password reset token is invalid or has expired.'
          });
        }
      });
    },
    (user, done) => {

      res.render(path.resolve('api/users/templates/password-changed.html'), {
        subject: 'Your password has been changed',
        name: user.profile.firstName,
        appName: config.web.title
      }, (err, emailHTML) => {
        done(err, emailHTML, user);
      });
    },
    // If valid email, send reset email using service
    (emailHTML, user, done) => {
      var mailOptions = {
        to: `"${user.profile.firstName} ${user.profile.lastName}" <${user.email}>`,
        from: config.mailer.from,
        subject: 'Your password has been changed',
        html: emailHTML
      };

      mailer.sendMail(mailOptions, (err) => {
        done(err, user);
      });
    }
  ], (err, user) => {
    if (err) {
      logger.error('[reset password] error:', err);
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json({
      email: user.email
    })
  });
};

/**
 * Validate Password
 */
exports.validatePassword = async (req, res) => {
  try {
    let { password } = req.body;
    let user = await User.findById(req.currentUser._id);
    if(!user) {
      return res.json({error: 'User not found'});
    }
    return res.json({valid: user.authenticate(password)});
  } catch (err) {
    logger.error(err);
    res.status(500).json({error: "Internal Server Error"});
  }
};

/**
 * Change Password
 */
exports.changePassword = (req, res) => {
  let passwordDetails = req.body;

  async.waterfall([
    /**
     * Save user
     */
    (done) => {
      User.findById(req.currentUser._id, (err, user) => {
        done(err, user);
      });
    },
    (user, done) => {
      policy.processSecondFactor(req, res, (err) => {
        done(err, user);
      });
    },
    /**
     * Change password
     */
    (user, done) => {
      if (user.authenticate(passwordDetails.currentPassword)) {
        user.password = passwordDetails.password;

        // async create new gitea user
        broker.instance.emit(`GiteaService.changePassword`, { user: _.pick(user, ['_id', 'profile', 'email']), password: user.password }, [`CREATORS_STUDIO${config.environment === 'production' ? '' : '_DEV'}`]);

        user.save((err, user) => {
          done(err, user);
        });
      } else {
        return res.status(422).send({
          message: 'Current password is incorrect'
        });
      }
    },
    /**
     * Render email
     */
    (user, done) => {
      res.render(path.resolve('api/users/templates/password-changed.html'), {
        name: user.profile.firstName,
        appName: config.web.title
      }, (err, emailHTML) => {
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
        subject: `Your password has been changed`,
        html: emailHTML
      };
      mailer.sendMail(mailOptions, (err) => {
        if (err) {
          logger.error('Send mail: ', err);
        }
        done(null, user);
      });
    }
  ], (err, user) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({});
  });

};

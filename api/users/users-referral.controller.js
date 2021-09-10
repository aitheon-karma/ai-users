/**
 * Module dependencies.
 */
const _ = require('lodash'),
    express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    errorHandler = require('../core/errors.controller'),
    policy = require('../core/policy.controller'),
    logger = require('../core/logger'),
    path = require('path'),
    config = require(path.resolve('./config')),
    async = require('async'),
    mailer = require('../core/mailer'),
    request = require('request');

const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;


exports.checkReferral = (req, res) => {
  const referralCode = req.params.referralCode;
  User.findOne({ referralCode: referralCode }).exec((err, referredUser) => {
    if (err) {
      return res.status(501).send({message: "Something went wrong"});
    }
    if (!referredUser) {
      return res.status(200).send({message: "Invalid referral code", valid: false});
    }
    return res.status(200).send({message: "Valid referral code", valid: true});
  });
}

/**
 * Invite Referral
 */
exports.inviteReferral = (req, res) => {
  let alreadyExist = '';
  let emails = req.body.emails;
  if (!emails){
    return res.status(422).send({
      message: 'Emails is required'
    });
  }

  emails = emails.split(',').map((e) => {
    return _.trim(e);
  });

  emails = emails.filter((e) => { return !!e || !emailRegex.test(e); });

  if (emails.length == 0){
    return res.status(422).send({
      message: 'Emails is required'
    });
  }

  const subject = 'You are invited to Aitheon';

  async.waterfall([
    (done) => {
      User.findById(req.currentUser, 'referralCode').lean().exec(done);
    },
    (user, done) => {
      User.find({ email: { $in: emails }}).exec((err, users) => {
        if (err){
          return done(err);
        }
        if (users.length === 0){
          return done(null, user);
        }

        users.forEach((user) => {
          if (!alreadyExist){
            alreadyExist += user.email;
          } else {
            alreadyExist += (', ' + user.email);
          }
          emails.splice(emails.indexOf(user.email, 1));
        });

        if (emails.length == 0){
          return res.json({
            alreadyExist: 'all'
          });
        }

        done(null, user);

      });
    },
    /**
     * Render email
     */
    (user, done) => {
      const httpTransport = 'http://';
      if (config.secure) {
        httpTransport = 'https://';
      }
      const baseUrl = config.domain || httpTransport + req.headers.host;
      const referralCode = user.referralCode;
      const referralUrl = `${ httpTransport }${ baseUrl }/users/signup#referral=${ referralCode }`;
      res.render(path.resolve('api/users/templates/referral-invite.html'), {
        subject: subject,
        referralUrl: referralUrl,
        appName: config.web.title
      }, function (err, emailHTML) {
        done(err, emailHTML);
      });
    },
    /**
     * Send mail
     */
    (emailHTML, done) => {
      async.each(emails, (emailAddress, emailDone) => {
        logger.debug('[inviteReferral] send mail: ', emailAddress);
        if (!emailAddress){
          logger.debug('[inviteReferral] send mail empty. All emails: ', req.body.emails);
          return emailDone(null);
        }
        let mailOptions = {
          to: emailAddress,
          from: config.mailer.from,
          subject: subject,
          html: emailHTML
        };
        mailer.sendMail(mailOptions, function (err) {
          if (err) {
            logger.error('[inviteReferral] Send mail error: ', err);
          }
          logger.debug('[inviteReferral] Done: ', emailAddress);
          emailDone(null);
        });
      }, (err) => {
        done(err);
      });
    }
  ], function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({
      alreadyExist: alreadyExist
    })
  });
};

/**
 * Invite Referral
 */
exports.getReferral = (req, res) => {
  async.parallel([
    (done) => {
      User.findById(req.currentUser, 'referralCode').lean().exec(done);
    },
    (done) => {
      const userId = mongoose.Types.ObjectId(req.currentUser._id);
      User.aggregate([
        { $match: { "referredByUser": userId } },
        { $lookup: { "from" : "users__wallet", "localField" : "_id", "foreignField" : "user", "as" : "users__wallet" } },
        { $unwind: { path : "$users__wallet", preserveNullAndEmptyArrays: true, includeArrayIndex : "walletIndex" } },
        { $project: { users__wallet: { tokens: 1 } }}
      ]).exec(done);
    }
  ], (err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    let referralTokenAmount = 0;
    result[1].forEach((refUser) => {
      if (refUser.users__wallet && refUser.users__wallet.tokens){
        referralTokenAmount += refUser.users__wallet.tokens;
      }
    });
    res.json({
      referralCode: result[0].referralCode,
      referralCount: result[1].length,
      referralTokenAmount: referralTokenAmount
    })
  });
};

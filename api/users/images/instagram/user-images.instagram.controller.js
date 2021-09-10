/**
 * Module dependencies.
 */
const _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  policy = require('../../../core/policy.controller'),
  path = require('path'),
  config = require(path.resolve('./config')),
  request = require('request'); 

let httpTransport = 'http://';
if (config.secure) {
  httpTransport = 'https://';
}
const baseUrl = config.environment == 'production' ? `${config.domain}` : `${config.domain}:${config.port}`

getInstagramRedirectURI = function(req) {
  const redirectURI = `${httpTransport}${baseUrl}${ config.environment == 'production' ? '/users' : '' }/api/users/instagram?fl_token=${policy.getTokenFromRequest(req)}`;
  return redirectURI;
}

getInstagramAuthURI = function(req) {
  const instagramAuthURI = `${config.instagram.auth_uri}client_id=${config.instagram.client_id}&redirect_uri=${getInstagramRedirectURI(req)}&response_type=code`;
  return instagramAuthURI;
}

exports.authInstagram = (req, res) => {
  res.redirect(getInstagramAuthURI(req));
}

exports.linkInstagram = (req, res) => {
  request.post({
    url: config.instagram.token_exchange_uri,
    form: {
      client_id: config.instagram.client_id,
      client_secret: config.instagram.client_secret,
      grant_type: config.instagram.grant_type,
      redirect_uri: getInstagramRedirectURI(req),
      code: req.query['code']
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, function (err, r, body) {
    if (err) {
      return res.send(500, { message: err.message });
    }

    User.findByIdAndUpdate(req.currentUser._id, {
      instagram_account: JSON.parse(body)
    })
      .exec((err, user) => {
        if (err) {
          return res.send(500, { message: err.message });
        }
        res.redirect(`${httpTransport}${ baseUrl }${config.environment == 'production' ? '/users' : ''}/public-profile#images`);
      });
  });
}

exports.unlinkInstagram = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, {
    $unset : {
      instagram_account: 1
    }
  })
    .exec((err, user) => {
      if (err) {
        return res.send(500, { message: err.message });
      }
      res.sendStatus(204);
    });
}

exports.getInstagramImages = (req, res) => {
  let userId = req.params.userId || req.currentUser._id;
  User.findById(userId, 'instagram_account.access_token')
    .exec((err, user) => {
      if (err) {
        return res.send(500, { message: err.message });
      }

      const instagram_access_token = user.instagram_account ? user.instagram_account.access_token : undefined;
      if (!instagram_access_token) {
        return res.send(401, { message: 'User not linked to Instagram' });
      }

      request.get(`${config.instagram.recent_media_uri}${instagram_access_token}`, function (err, r, body) {
        if (err) {
          return res.send(500, { message: err.message });
        }

        res.json(JSON.parse(body).data);
      });
    })
}
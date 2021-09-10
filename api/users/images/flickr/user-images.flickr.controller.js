/**
 * Module dependencies.
 */
const _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  policy = require('../../../core/policy.controller'),
  path = require('path'),
  config = require(path.resolve('./config')),
  request = require('request'),
  OAuth = require('oauth-1.0a');
  crypto = require('crypto');
  
const oauth = OAuth({
  consumer: {
    key: config.flickr.oauth_consumer_key,
    secret: config.flickr.client_secret
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  }
});

var token = {
  key: '',
  secret: ''
};

let httpTransport = 'http://';
if (config.secure) {
  httpTransport = 'https://';
}
const baseUrl = config.environment == 'production' ? `${config.domain}` : `${config.domain}:${config.port}`

exports.getRequestWithHeaders = (req, res) => {
  var flickrCall = {
    url: config.flickr.request_token,
    method: 'GET',
    data: {
        oauth_callback: `${httpTransport}${baseUrl}${ config.environment == 'production' ? '/users' : '' }/api/users/flickr/accessToken`
    }
  };
  request({
    url: flickrCall.url,
    method: flickrCall.method,
    form: flickrCall.data,
    headers: oauth.toHeader(oauth.authorize(flickrCall))
  },function (err, r, body) {
    if (err) {
      return res.send(500, { message: err.message });
    }
    else{
      response = body.split("&");
      oauth_callback_confirmed = response[0].split("=");
      if(oauth_callback_confirmed[1] == "true"){
        oauth_token = response[1].split("=");
        oauth_token_secret = response[2].split("=");
        token = {
          key: oauth_token[1],
          secret: oauth_token_secret[1]
        };
        res.redirect(`${httpTransport}${baseUrl}${ config.environment == 'production' ? '/users' : '' }/api/users/flickr/oauth/authorize`);
      }
    } 
  });
}

getFlickrRedirectURI = function(req) {
  const redirectURI = `${httpTransport}${baseUrl}${ config.environment == 'production' ? '/users' : '' }/api/users/flickr/oauth/authorize?oauth_token=${policy.getTokenFromRequest(req)}`;
  return redirectURI;
}

getFlickrAuthURI = function(req) {
  const flickrAuthURI = `${config.flickr.auth_token}oauth_token=${token.key}&oauth_callback=${getFlickrRedirectURI(req)}&perms=read`;
  return flickrAuthURI;
}

exports.getAuthorizationFlickr = (req, res) => {
  res.redirect(getFlickrAuthURI(req));
}

exports.getAccessToken = (req, res) => {
  var accessCall = {
  url: config.flickr.access_token,
  method: 'GET',
  data: {
      oauth_callback: `${httpTransport}${baseUrl}${ config.environment == 'production' ? '/users' : '' }/api/users/flickr/UserLogin`,
      oauth_token: req.query['oauth_token'],
      oauth_verifier: req.query['oauth_verifier']
    }
  };
  request({
    url: accessCall.url,
    method: accessCall.method,
    form: accessCall.data,
    headers: oauth.toHeader(oauth.authorize(accessCall, token))
  },function (err, r, body) {
    if (err) {
      return res.send(500, { message: err.message });
    }
    else{
      response = body.split("&");
      a_token = response[1].split("=");
      a_secret = response[2].split("=");
      token = {
        key: a_token[1],
        secret: a_secret[1]
      };
      res.redirect(`${httpTransport}${baseUrl}${ config.environment == 'production' ? '/users' : '' }/api/users/flickr/UserLogin`);  
    } 
  });
}

exports.getFlickrUserLogin = (req, res) => {
  var loginCall = {
      url: config.flickr.flickr_api,
      method: 'GET'
  };
  request({
    url: loginCall.url,
    method: loginCall.method,
    headers: oauth.toHeader(oauth.authorize(loginCall, token))
  },function (err, r, body) {
    if (err) {
      return res.send(500, { message: err.message });
    }
    else{
      User.findByIdAndUpdate(req.currentUser._id, {
        flickr_account: JSON.parse(body).user.id
      })
      .exec((err, user) => {
        if (err) {
          return res.send(500, { message: err.message });
        }
        res.redirect(`${httpTransport}${ baseUrl }${config.environment == 'production' ? '/users' : ''}/public-profile#images`);
      });
    } 
  });
}

exports.getFlickrImages = (req, res) => {
  let userId = req.params.userId || req.currentUser._id;
  User.findById(userId, 'flickr_account')
    .exec((err, user) => {
      if (err) {
        return res.send(500, { message: err.message });
      }

      const flickr_id = user.flickr_account ? user.flickr_account : undefined;
      if (!flickr_id) {
        return res.send(401, { message: 'User not linked to Flickr' });
      }

      request.get(`${config.flickr.get_images}&id=${flickr_id}`, function (err, r, body) {
        if (err) {
          return res.send(500, { message: err.message });
        }
        const imageUrls = [];
        var items = JSON.parse(body).items;
        items.forEach(flickrImages => {
          var fileURL = (flickrImages.media.m).split('_m.');
          imageUrls.push({
            thumb: fileURL[0]+'_q.'+fileURL[1],
            standard_resolution: fileURL[0]+'_c.'+fileURL[1]
          })
        });
        res.json(imageUrls);
      });
    })
}

exports.unlinkFlickr = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, {
    $unset : {
      flickr_account: 1
    }
  })
    .exec((err, user) => {
      if (err) {
        return res.send(500, { message: err.message });
      }
      res.sendStatus(204);
    });
}
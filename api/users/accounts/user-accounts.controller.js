/**
 * Module dependencies.
 */
const _ = require('lodash'),
    express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    UserAccount = mongoose.model('UserAccount'),
    path = require('path'),
    policy = require('../../core/policy.controller')
    errorHandler = require(path.resolve('./api/core/errors.controller')),
    coreController = require(path.resolve('./api/core/policy.controller')),
    config = require(path.resolve('./config')),
    UpworkApi = require('upwork-api'),
    Twitter = require('twitter'),
    request = require('request'),
    Roles = require('upwork-api/lib/routers/hr/roles.js').Roles,
    async = require('async');

/**
 * User account list
 */
exports.list = (req, res) => {
  let query = { user: req.currentUser };
  if (req.query.organization){
    query.organization = req.query.organization;
  }
  UserAccount.find(query).then((accounts) => {
    res.jsonp(accounts);
  })
  .catch((err) => {
    res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

exports.listAll = (req, res) => {

  let query = { type: req.params.accountType };
  UserAccount.find(query).then((accounts) => {
    let result = accounts.map((account) => {
      account = account.toJSON();
      if (account.type === 'UPWORK'){
        account.credentials.key = config.upwork.key;
        account.credentials.secret = config.upwork.secret;
      }
      return account;
    });
   
    res.jsonp(result);
  })
  .catch((err) => {
    res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};


/**
 * User account list
 */
exports.read = (req, res) => {
  let accountType = req.params.accountType;
  let query = { type: accountType };
  async.waterfall([
    (done) => {
      if (req.query.organization){
        query.organization = req.query.organization;
        req.params.organizationId = query.organization;
        policy.orgAdminIsAllowed(req, res, () => {
          done();
        });
      } else {
        query.user = req.currentUser;
        done();
      }
    },
    (done) => {
      UserAccount.findOne(query, done);
    }
  ], (err, account) => {
    if (err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    if (account && account.type === 'UPWORK'){
      account = account.toJSON();
      account.credentials.key = config.upwork.key;
      account.credentials.secret = config.upwork.secret;
      logger.debug('account ', account)
    }

    res.json(account);
  })
};

/**
 * Save User account
 */
exports.save = (req, res) => {
  let accountType = req.params.accountType;
  let credentials = req.body;
  let query = { type: accountType };
  let account = {
    type: accountType,
    credentials: credentials
  };

  async.waterfall([
    (done) => {
      if (req.query.organization){
        query.organization = req.query.organization;
        account.organization = req.query.organization;
        req.params.organizationId = query.organization;
        policy.orgAdminIsAllowed(req, res, () => {
          done();
        });
      } else {
        query.user = req.currentUser;
        account.user = req.currentUser;
        done();
      }
    },
    (done) => {
      UserAccount.findOneAndUpdate(query, account, { upsert: true, returnNewDocument: true }, done);
    }
  ], (err, account) => {
    if (err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(account);
  })
};


exports.createUpworkToken = (req, res) => {
  
  async.waterfall([
    (done) => {
      coreController.processOrganization(req, res, () => {
        done(null, req.currentOrganization)
      })
    },
    (organization, done) => {
      done(null, organization, new UserAccount({
        type: 'UPWORK', 
        organization: organization
      }))
    },
    (organization, account, done) => {
      var upworkConfig = {
        'consumerKey' : config.upwork.key,
        'consumerSecret' : config.upwork.secret
      };

      var httpTransport = 'http://';
      if (config.secure) {
        httpTransport = 'https://';
      }
      var baseUrl = `${ organization.domain }.${ config.domain }`;

      var api = new UpworkApi(upworkConfig);
      var callbackUrl = `${ httpTransport }${ baseUrl }/users/api/upwork-done?accountId=${ account._id }`;
      
      api.getAuthorizationUrl(callbackUrl, function(error, url, requestToken, requestTokenSecret) {
        if (error){
          logger.error('Upwork error', error);
          return res.status(422).json({ message: 'can not get authorization url, error: ' + error });
        }
      
        done(null, account, {
          requestToken: requestToken,
          requestTokenSecret: requestTokenSecret,
          url: url
        });
      });
    },
    (account, result, done)=> {

      account.set('credentials.requestToken', result.requestToken);
      account.set('credentials.requestTokenSecret', result.requestTokenSecret);

      UserAccount.findOneAndUpdate({ type: 'UPWORK', organization: organization } , account, { upsert: true }).save((err, newAccount) => {
        done(err, result);
      })
    }
  ], (err, result) => {
    if (err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(_.pick(result, 'url'))
  })

  
}

exports.upworkDone = (req, res) => {
  // console.log('upwork down', req.query);
  UserAccount.findById(req.query.accountId).exec((err, account) => {
    if (err || !account){
      return res.status(422).send({
        message: account ? errorHandler.getErrorMessage(err) : 'No account'
      });
    }

    var upworkConfig = {
      'consumerKey' : config.upwork.key,
      'consumerSecret' : config.upwork.secret
    };
    let verifier = req.query.oauth_verifier;
    var api = new UpworkApi(upworkConfig);
    // "Can't verify request, missing oauth_consumer_key or oauth_token"
    api.getAccessToken(account.credentials.requestToken, account.credentials.requestTokenSecret, verifier, function(error, accessToken, accessTokenSecret) {
      if (error){
        return res.status(422).send({
          message: errorHandler.getErrorMessage(error) || 'No account'
        });
      }
  
      account.set('credentials.accessToken', accessToken);
      account.set('credentials.accessTokenSecret', accessTokenSecret);

      UserAccount.findByIdAndUpdate(account._id, account).exec((err, newAccount) => {
        if (err){
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err) || 'No account'
          });
        }
        return res.redirect('/users/organization-detail?upwork-success=true');
      })
      
    });

  })
  
}

exports.upworkRoles = (req, res) => {
  UserAccount.findOne({ type: 'UPWORK', organization: req.currentOrganization }).exec((err, account) => {
    if (err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    const upworkConfig = {
      'consumerKey' : config.upwork.key,
      'consumerSecret' : config.upwork.secret
    };
    const upworkApi = new UpworkApi(upworkConfig);
    upworkApi.setAccessToken(account.credentials.accessToken, account.credentials.accessTokenSecret, () => {
      // get my auth data
      const roles = new Roles(upworkApi);
      roles.getAll((err, data) => {
        if (err){
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        if (!_.isArray(data.userroles.userrole)){
          data.userroles.userrole = [data.userroles.userrole];
        }
        
        account.set('credentials.rolesData', data);
        account.save(() => {
          res.json(data);
        })
      });
    });
  });
  
}

exports.saveUpworkRoles = (req, res) => {
  UserAccount.findOne({ type: 'UPWORK', organization: req.currentOrganization }).exec((err, account) => {
    if (err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    account.set('credentials.current_company__reference', req.body.company__reference);
    account.save(() => {
      res.sendStatus(204)
    })
  });
  
}

exports.joinTwitter = (req, res) => {
  request.post({
    url: 'https://api.twitter.com/oauth/request_token',
    oauth: {
      oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
      consumer_key: config.twitter.consumer_key,
      consumer_secret: config.twitter.consumer_secret
    }
  }, function (err, r, body) {
    if (err) {
      return res.send(500, { message: err.message });
    }


    var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
    res.send(JSON.parse(jsonStr));
  });
}

exports.unlinkTwitter = (req, res) => {
  
}

/*
 * Module dependencies.
 */
const request = require('request'),
      path = require('path'),
      mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      //read-only organization schema
      Organization = mongoose.model('Organization');
      config = require(path.resolve('./config')),
      jwtDecode = require('jwt-decode'),
      logger = require('../core/logger'),
      _ = require('lodash');
const {ErrorNotAuthorized, ErrorNotFound, ErrorUndefinedState, errorResponse} = require('../core/errors.controller.js');

/*
 * Module constants.
 */
const ROLES = ['User', 'OrgAdmin', 'SuperAdmin', 'Owner'];

/**
* Process user with decode JWT token.
* We can trust token because it's already processed with Nginx proxy Auth service.
*/
exports.processUserLocal = (req, res, next) => {

  let token = '';
  let authorization = req.headers['authorization'];
  if (authorization && authorization.indexOf('JWT ') > -1){
    token = authorization.split(' ')[1];
  }

  if (!token){
    token = req.cookies && req.cookies['fl_token'];
  }

  if (!token){
    token = req.query['fl_token'];
  }

  if (!token){
    return res.status(500).send({ message: 'Error: Token Missing' });
  }

  req.currentUser = jwtDecode(token);
  next();
}

function getTokenFromRequest(req) {
  let token = '';
  let authorization = req.headers['authorization'];
  if (authorization && authorization.indexOf('JWT ') > -1){
    token = authorization.split(' ')[1];
  }

  if (!token){
    token = req.cookies && req.cookies['fl_token'];
  }

  if (!token){
    token = req.query['fl_token'];
  }
  return token;
}

exports.getTokenFromRequest = getTokenFromRequest;

/**
 * Process current user with call to auth uri with token.
 * Use this only in case you need validated token once more.
 */
exports.processUser = (req, res, next) => {

  // if we already processed user just return it
  if (req.currentUser){
    return next();
  }

  let token = getTokenFromRequest(req);
  if (!token){
    return res.status(401).send({ message: 'Error: Token Missing' });
  }

  var options = {
    url: `${ config.authURI }/api/me`,
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${ token }`
    },
    json: true
  };
  // console.log('options', options);
  request(options, function (error, response, body) {
    // console.log('error:', error); // Print the error if one occurred
    // console.log('token check:', response && response.statusCode); // Print the response status code if a response was received
    // console.log('body:', body); // Print the HTML for the Google homepage.

    if (error){
      return next(error);
    }

    if (response.statusCode != 200){
      return res.status(response.statusCode).send({
        message: 'Not authorized'
      });
    }

    if (body){
      req.currentUser = body;
    }

    next();
  });
}

/**
 * Check if user has any organization role
 */
exports.orgIsAllowed = (req, res, next) => {
  const userRole = _.find(req.currentUser.roles, (userRole) => { return userRole.organization._id === req.params.organizationId });
  if (!userRole){
    return res.status(401).send({
      message: 'Not authorized'
    });
  }

  next();
}

/**
 * Check if user has Owner or OrgAdmin organization role
 */
exports.ownerIsAllowed = (req, res, next) => {
  const allowedRoles = ['Owner', 'SuperAdmin'];
  const ownerOrganizations = _.filter(req.currentUser.roles, (userRole) => { return allowedRoles.indexOf(userRole.role) > -1; });

  // User is not owner of any organization or superadmin there
  if (ownerOrganizations.length === 0){
    return res.status(401).send({
      message: 'Not authorized'
    });
  }

  // Action is called without spesific organization
  // So we just check if user has any owner/superadmin in any organizations
  if (!req.params.organizationId){
    req.ownerOrganizations = ownerOrganizations;
    return next();
  }

  const userRole = _.find(req.currentUser.roles, (userRole) => { return userRole.organization._id === req.params.organizationId });
  if (!userRole){
    return res.status(401).send({
      message: 'Not authorized'
    });
  }

  if (allowedRoles.indexOf(userRole.role) > -1){
    next();
  } else {
    return res.status(401).send({
      message: 'Not authorized'
    });
  }
}

/**
 * Check if user has Owner or OrgAdmin organization role
 */
exports.orgAdminIsAllowed = (req, res, next) => {
  const allowedRoles = ['Owner', 'SuperAdmin', 'OrgAdmin'];
  let organizationId = req.params.organizationId;
  if (!organizationId && req.currentOrganization){
    organizationId = req.currentOrganization._id.toString();
  }
  const userRole = _.find(req.currentUser.roles, (userRole) => { return userRole.organization._id === organizationId });
  if (!userRole){
    return res.status(401).send({
      message: 'Not authorized'
    });
  }

  if (allowedRoles.indexOf(userRole.role) > -1){
    next();
  } else {
    return res.status(401).send({
      message: 'Not authorized'
    });
  }
}

exports.serviceAllowed = (serviceId, role) => {
  // organizationId
  return function(req, res, next) {
    let organizationId = req.params.organizationId;
    if (req.body && req.body.organization){
      organizationId = req.body.organization;
    }

    const userRole = _.find(req.currentUser.roles, (userRole) => { return userRole.organization._id === organizationId });
    if (!userRole){
      // check if it's owner
      return exports.orgAdminIsAllowed(req, res, next);
    }
    const service = userRole.services.find((s) => { return s.service === serviceId });
    if (!service){
       // check if it's owner
       return exports.orgAdminIsAllowed(req, res, next);
    }

    if (service.role === 'ServiceAdmin' || service.role === role){
      next();
    } else {
       // check if it's owner
      return exports.orgAdminIsAllowed(req, res, next);
    }
  }
}

/**
 * Check if user has Admin or Owner organization role
 */
exports.sysadminOnly = (req, res, next) => {
  if (req.currentUser.sysadmin){
    next();
  } else {
    return res.status(401).send({
      message: 'Not authorized'
    });
  }
}

/**
 * Check if user has Admin or Owner organization role without redirect to login page
 */
exports.sysadminOnlyNoRedirect = (req, res, next) => {
  if (req.currentUser.sysadmin){
    next();
  } else {
    return res.status(422).send({
      message: 'Need Sysadmin rights'
    });
  }
}

/**
 * Check if user has platform role access without redirect to login page
 */
exports.platformRoleOnly = (req, res, next) => {
  if (req.currentUser.sysadmin || req.currentUser.platformRole === 'PLATFORM_ADMIN' || req.currentUser.platformRole === 'PLATFORM_MANAGER'){
    next();
  } else {
    return res.status(422).send({
      message: 'Need access'
    });
  }
}


/**
 * Process Organization and set req.currentOrganization to organization with which we work
 * @param {Request} req expressjs request object
 * @param {Response} res expressjs response object
 * @param {Function} next function to be called when all done
 */
exports.processOrganization = (req, res, next) => {

  if (req.headers['organization-id']){
    // if we have organization-id to decrease db request, we take it.
    req.currentOrganization = {
      _id : req.headers['organization-id']
    };
    return next();
  }

  // if we already proccessed organization
  if (req.currentOrganization){
    return next();
  }

  let host = req.headers['origin'] || req.headers['host'];
  host = host.replace(/^(http|https):\/\//, '');
  const domains = host.split('.');

  // console.log('host:', host);

  let organizationDomain;
  if (req.headers['organization-domain']){
    organizationDomain = req.headers['organization-domain'];
  }

  if (!organizationDomain){
    organizationDomain = req.query['organization-domain'];
  }

  if (domains.length > 1){
    organizationDomain = domains[0];
  }

  // no organization
  if (!organizationDomain){
    return res.status(403).send({
      message: 'Request is missing organization header or not under sub-domain'
    });
  }

  Organization.findOne({ domain: organizationDomain }, '_id domain name').lean().exec((err, organization) => {
    if (err){
      return next(err);
    }
    if (!organization){
      return res.status(403).send({
        message: 'Request is missing organization header or not under sub-domain'
      });
    }

    req.currentOrganization = organization;
    return next();
  });

}

exports.getOrganization = (req) => {
  return new Promise((resolve, reject) => {
    let host = req.headers['origin'] || req.headers['host'];
    host = host.replace(/^(http|https):\/\//, '');
    const domains = host.split('.');

    // console.log('host:', host);

    let organizationDomain;
    if (req.headers['organization-domain']){
      organizationDomain = req.headers['organization-domain'];
    }

    if (!organizationDomain){
      organizationDomain = req.query['organization-domain'];
    }

    if (domains.length > 1){
      organizationDomain = domains[0];
    }

    // no organization
    if (!organizationDomain){
      resolve(undefined);
    }

    Organization.findOne({ domain: organizationDomain }, '_id domain name').lean().exec((err, organization) => {
      if (err){
        return reject(err);
      }
      if (!organization){
        return resolve(undefined);
      }

      return resolve(organization);
    });
  })

}

exports.interLocalAllowed = (req, res, next) => {
  if (req.connection.localPort === 3443){
    return next();
  }
  logger.warn('[interLocalAllowed] Not authorized: ', req.ip, req.connection.localPort);
  return res.status(401).send({
    message: 'Not authorized'
  });
}


/**
 * Request second factor
 */
exports.processSecondFactor = (req, res, next) => {

  let token = getTokenFromRequest(req);
  if (!token){
    return res.status(401).send({ message: 'Error: Token Missing' });
  }

  const code = req.query.otpCode;
  const body = { code: code };

  var options = {
    url: `${ config.authURI }/api/second-factor`,
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${ token }`
    },
    json: true,
    body: body
  };

  // console.log('options', options);
  request(options, (error, response, body) => {
    // console.log('error:', error); // Print the error if one occurred
    // console.log('token check:', response && response.statusCode); // Print the response status code if a response was received
    // console.log('body:', body); // Print the HTML for the Google homepage.

    if (error){
      return next(error);
    }

    // 201
    if (response.statusCode != 200){
      return res.status(response.statusCode).send(body);
    }

    next();
  });
}

/**
 * Check if user has role authorized to change role to requested within organization
 */

exports.orgUserRoleChangeAbilityAuthorized = (req, res, next) => {
  let roleToAssign = req.body.role;
  let organizationId = req.params.organizationId;
  if (!organizationId && req.currentOrganization){
    organizationId = req.currentOrganization._id.toString();
  }
  const userRole = _.find(req.currentUser.roles, (userRole) => { return userRole.organization._id === organizationId });
  if (!userRole){
    return errorResponse(res,new ErrorNotAuthorized('Not authorized'));
  }

  let userRoleWeight = ROLES.indexOf(userRole.role);
  let roleToAssignWeight = ROLES.indexOf(roleToAssign);

  if(userRoleWeight === -1){
    return errorResponse(res,new ErrorUndefinedState('Not able to derive user role'));
  }
  if(roleToAssignWeight === -1){
    return errorResponse(res,new ErrorNotFound('Not able to find role to assign'));
  }
  if (roleToAssignWeight > userRoleWeight){
    return errorResponse(res,new ErrorNotAuthorized('Not authorized'));
  }
  next();
}

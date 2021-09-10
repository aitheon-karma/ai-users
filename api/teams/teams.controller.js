/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Organization = mongoose.model('Organization');
const Service = mongoose.model('Service');
const Team = mongoose.model('Team');
const errorHandler = require('../core/errors.controller');

/*
 * team list by organization
 */
exports.list = (req, res) => {
  Team.find({ organization: req.organization }).exec((err, teams) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(teams);
  });
};

/**
 * team middleware
 */
exports.teamByID = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Team is invalid',
    });
  }

  Team.findById(id).exec((err, team) => {
    if (err) {
      return next(err);
    } if (!team) {
      return res.status(404).send({
        message: 'No team with that identifier has been found',
      });
    }
    req.team = team;
    next();
  });
};

/*
 * Create team
 */
exports.create = (req, res) => {
  const team = new Team(req.body);
  team.organization = req.organization;

  team.save((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(team);
  });
};

/*
 * Update team
 */
exports.update = (req, res) => {
  let { team } = req;
  team.organization = req.organization;

  team = _.extend(team, req.body);

  team.save((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(team);
  });
};

/*
 * Delete team
*/
exports.delete = (req, res) => {
  const { team } = req;

  team.remove((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(team);
  });
};

/**
 * Search all teams and members by orgIds
 */
exports.searchTeam = (req, res) => {
  let organizationId = req.params.organizationId;
  const searchKey = decodeURIComponent(req.query.searchKey);
  const organizations = req.query.orgIds.split(',');
  organizations.push(organizationId);
  const query = {
    $and: [
      { 'organization': { $in: organizations } },
      {
        $or: [
          { 'name': { $regex: searchKey, $options: 'i' } },
        ]
      }
    ]
  };
  Team.find(query).populate('organization').exec((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.jsonp(team);
    }
  });
}

/**
 * Search all users by teamIds
 */
exports.searchTeamMembers = (req, res) => {
  const searchKey = decodeURIComponent(req.query.searchKey);
  const teams = req.query.teamIds.split(',');
  const query = {
    'roles.teams': { $in: teams }
  };
  User.find(query).populate('organization').exec((err, team) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    else {
      res.jsonp(team);
    }
  });
}
/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const BugReport = mongoose.model('BugReport');
const errorHandler = require('../core/errors.controller');

/*
 * Create bug report
 */
exports.create = async (req, res) => {
  try {
    const bug = req.body;
    bug.user = req.currentUser;
    bug.userAgent = req.headers['user-agent'];
    bug.ip = getIp(req);
    bug.status = 'SUBMITTED';
    await new BugReport(bug).save();
    res.sendStatus(201);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

const getIp = (req) => {
  var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);
  return ip;
}
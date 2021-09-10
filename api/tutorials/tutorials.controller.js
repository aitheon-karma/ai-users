/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');

const TutorialSettings = mongoose.model('TutorialSettings');
const TutorialVideo = mongoose.model('TutorialVideo');
const errorHandler = require('../core/errors.controller');

/*
 * Settings for Aitheon tutorials
 */
exports.listSettings = (req, res) => {
  TutorialSettings.findOne({}).populate('organizationVideo').populate('welcomeVideo').exec((err, tutorialSettings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(tutorialSettings);
  });
};

/*
 * Create settings
 */
exports.create = (req, res) => {
  const tutorialSettings = new TutorialSettings(req.body);

  tutorialSettings.save((err, tutorialSettings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(tutorialSettings);
  });
};

/*
 * Create tutorial video
 */
exports.createMedia = (req, res) => {
  const tutorialVideo = new TutorialVideo(req.body);

  tutorialVideo.save((err, tutorialVideo) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    const newSettings = req.body.isOrganization ? {organizationVideo: tutorialVideo._id} : {welcomeVideo: tutorialVideo._id}
    TutorialSettings.findOneAndUpdate({}, newSettings, {upsert: true}).exec((err, tutorialSettings) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err),
        });
      }
      res.jsonp(tutorialSettings);
    });
  });
};

/*
 * Update settings
 */
exports.update = (req, res) => {
  let { tutorialSettings } = req;

  tutorialSettings = _.extend(tutorialSettings, req.body);

  tutorialSettings.update((err, tutorialSettings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(tutorialSettings);
  });
};

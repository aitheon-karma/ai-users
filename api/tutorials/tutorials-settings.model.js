/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const TutorialsSettingsSchema = new Schema({
  organizationVideo: {
    type: Schema.ObjectId,
    ref: 'TutorialVideo'
  },
  welcomeVideo: {
    type: Schema.ObjectId,
    ref: 'TutorialVideo'
  },
},{
  timestamps: true,
  collection: 'users__tutorial_settings',
});

module.exports = mongoose.model('TutorialSettings', TutorialsSettingsSchema);

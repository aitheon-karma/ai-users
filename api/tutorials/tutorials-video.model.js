/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const TutorialsVideoSchema = new Schema({
    filename: String,
    mimetype: String,
    url: String,
    isOrganization: Boolean
},{
  timestamps: true,
  collection: 'users__tutorial_videos',
});

module.exports = mongoose.model('TutorialVideo', TutorialsVideoSchema);

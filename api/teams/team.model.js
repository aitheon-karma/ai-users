/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const TeamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  services: [{
    _id: false,
    service: {
      type: String,
      ref: 'Service'
    },
    role: {
      type: String,
      enum: ['ServiceAdmin', 'User'],
      default: 'User'
    }
  }],
  parent: {
    type: Schema.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

TeamSchema.pre("save", function (next, done) {
  var self = this;
  mongoose.models["Team"].findOne({ organization: self.organization, name: self.name, _id: { $ne: self._id } }, function (err, team) {
    if (err) {
      return next(err);
    } else if (team) {
      self.invalidate("name", "Name must be unique per organization");
      return next(new Error("Name must be unique per organization"));
    }
    next();
  });

});

module.exports = mongoose.model('Team', TeamSchema);

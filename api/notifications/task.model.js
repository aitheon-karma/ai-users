const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Database schema/collection
 */
const TaskSchema = new Schema({
  name: String,
  description: String,
  orderIndex: Number,
  priority: Number,
  state: String,
  type: {
    type: String
  },
  recurring: Boolean,
  addToCalendar: Boolean,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  parentTask: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  assigned: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  service: {
    type: String,
    ref: 'Service'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  files: [{
    _id: Schema.Types.ObjectId,
    name: String,
    signedUrl: String,
    contentType: String
  }],
  estimateHours: {
    min: Number,
    max: Number
  },
  startDate: Date,
  finishDate: Date,
  remainingHours: Number,
  dependencies: [{
    dependencyType: String,
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    }
  }],
  dependents: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  loggedTime: [{
    startTime: Date,
    endTime: Date,
    totalTime: Number,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
  }],
  estimatedCompletionDays: {
    soonestDays: Number,
    latestDays: Number,
    projectedDays: Number
  },
  action: {
    name: String,
    redirect: String,
    referenceId: String,
    data: Schema.Types.Mixed,
  },
  read: {
    type: Boolean,
    default: false
  },
  isNotify: {
    type: Boolean,
    default: false
  },
  notifyDate: {
    type: Date,
    default: Date.now
  }
},
{
  timestamps: true,
  collection: 'orchestrator__tasks'
});

module.exports = mongoose.model('Task', TaskSchema);

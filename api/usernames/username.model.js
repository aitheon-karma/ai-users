const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usernameSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    index: true,
    validate: [usernameValidator, 'Invalid username']
  },
  usedFor: {
    type: String,
    enum: ['BOT', 'USER', 'DEVICE', 'ORGANIZATION']
  },
  reference: {
    type: Schema.Types.ObjectId,
    refPath: 'usedFor'
  }
}, {
  collection: 'communications__usernames',
  timestamps: true
});


function usernameValidator(username) {
  const usernameRegex = /^$|(?=^[\w-]{3,30}$)[a-zA-Z0-9-]+(?:[_ -]?[a-zA-Z0-9-])*$/;
  return usernameRegex.test(username);
}


module.exports = mongoose.model('Username', usernameSchema);

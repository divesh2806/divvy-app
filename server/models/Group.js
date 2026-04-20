const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Matches the name in your User model
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Matches the name in your User model
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Group', GroupSchema);
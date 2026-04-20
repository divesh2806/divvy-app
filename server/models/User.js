const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Ensures "User@Email.com" is stored as "user@email.com"
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // NEW: Store list of friends (User-to-User relationship)
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

// Middleware to ensure we don't return the password by default when calling toJSON
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
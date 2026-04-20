const mongoose = require('mongoose');

const PersonalTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  accountType: { type: String, enum: ['digital', 'cash'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true, default: 'General' },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PersonalTransaction', PersonalTransactionSchema);

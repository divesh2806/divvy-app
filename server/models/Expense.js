const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  payer: { type: String, required: true }, // Name of the person who paid
  splitAmong: [{ type: String }],          // Array of names sharing the cost
  share: { type: Number },                 // amount / splitAmong.length
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
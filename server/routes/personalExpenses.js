const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PersonalTransaction = require('../models/PersonalTransaction');
const User = require('../models/User');

// @route   POST api/personal/add
// @desc    Add a personal transaction (income or expense)
router.post('/add', auth, async (req, res) => {
  try {
    const { type, accountType, amount, category, description, date } = req.body;

    const newTransaction = new PersonalTransaction({
      user: req.user.id,
      type,
      accountType,
      amount: parseFloat(amount),
      category,
      description,
      date: date ? new Date(date) : new Date()
    });

    const transaction = await newTransaction.save();
    res.json(transaction);
  } catch (err) {
    console.error("Add Personal Transaction Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/personal
// @desc    Get personal transactions timeline
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await PersonalTransaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Get Personal Transactions Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/personal/stats
// @desc    Get balances and category breakdown
router.get('/stats', auth, async (req, res) => {
  try {
    const transactions = await PersonalTransaction.find({ user: req.user.id });

    let cashBalance = 0;
    let digitalBalance = 0;
    const categoryBreakdown = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        if (t.accountType === 'cash') cashBalance += t.amount;
        if (t.accountType === 'digital') digitalBalance += t.amount;
      } else if (t.type === 'expense') {
        if (t.accountType === 'cash') cashBalance -= t.amount;
        if (t.accountType === 'digital') digitalBalance -= t.amount;

        // Aggregate category ONLY for expenses
        const cat = t.category || 'General';
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = 0;
        categoryBreakdown[cat] += t.amount;
      }
    });

    res.json({
      cashBalance,
      digitalBalance,
      categoryBreakdown
    });
  } catch (err) {
    console.error("Get Personal Stats Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/personal/:id
// @desc    Delete a personal transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await PersonalTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this transaction' });
    }

    await transaction.deleteOne();
    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error("Delete Transaction Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

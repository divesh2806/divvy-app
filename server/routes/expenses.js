const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @route   POST api/expenses/add
// @desc    Add a new expense (Group or 1-on-1)
router.post('/add', auth, async (req, res) => {
  try {
    const { description, amount, payer, splitAmong, groupId } = req.body;

    if (!splitAmong || splitAmong.length === 0) {
      return res.status(400).json({ msg: 'Please select at least one person' });
    }

    const share = amount / splitAmong.length;

    const newExpense = new Expense({
      description,
      amount: parseFloat(amount),
      payer,
      splitAmong,
      share,
      group: groupId || null, // If no group ID is passed, it saves as null (1-on-1)
      creator: req.user.id
    });

    const expense = await newExpense.save();
    res.json(expense);
  } catch (err) {
    console.error("Add Expense Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenses
// @desc    Get expenses for a specific group OR a specific friend
router.get('/', auth, async (req, res) => {
  try {
    if (req.query.group) {
      // Fetch ONLY expenses attached to this specific group
      const expenses = await Expense.find({ group: req.query.group }).sort({ date: -1 });
      return res.json(expenses);
    } else if (req.query.friend) {
      // Fetch 1-on-1 expenses (No group, and involves both users)
      const user = await User.findById(req.user.id);
      const friend = await User.findById(req.query.friend);
      
      if (!user || !friend) return res.status(404).json({ msg: "User not found" });

      const expenses = await Expense.find({
        group: null, // Critical: Ensure it is NOT part of a group
        $and: [
          { $or: [{ payer: user.name }, { splitAmong: user.name }] },
          { $or: [{ payer: friend.name }, { splitAmong: friend.name }] }
        ]
      }).sort({ date: -1 });
      
      return res.json(expenses);
    }
    
    res.json([]);
  } catch (err) {
    console.error("Get Expenses Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenses/balances
// @desc    Calculate balances for a group OR a friend
router.get('/balances', auth, async (req, res) => {
  try {
    let expenses = [];
    
    if (req.query.group) {
      expenses = await Expense.find({ group: req.query.group });
    } else if (req.query.friend) {
      const user = await User.findById(req.user.id);
      const friend = await User.findById(req.query.friend);
      
      expenses = await Expense.find({
        group: null,
        $and: [
          { $or: [{ payer: user.name }, { splitAmong: user.name }] },
          { $or: [{ payer: friend.name }, { splitAmong: friend.name }] }
        ]
      });
    }

    const balances = {};

    expenses.forEach(exp => {
      // 1. The person who paid gets the total amount added to their balance
      if (!balances[exp.payer]) balances[exp.payer] = 0;
      balances[exp.payer] += exp.amount;

      // 2. Everyone involved gets their share subtracted
      exp.splitAmong.forEach(person => {
         if (!balances[person]) balances[person] = 0;
         balances[person] -= exp.share;
      });
    });

    // Clean up tiny floating point errors (e.g., 0.00000001 becomes 0)
    for (let key in balances) {
      if (Math.abs(balances[key]) < 0.01) {
         balances[key] = 0;
      }
    }

    res.json(balances);
  } catch (err) {
    console.error("Balances Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/expenses/settle-up
// @desc    Record a payment to clear debt
router.post('/settle-up', auth, async (req, res) => {
  try {
    const { from, to, amount, groupId } = req.body;

    const newSettlement = new Expense({
      description: `Settlement: ${from} paid ${to}`,
      amount: parseFloat(amount),
      payer: from,
      splitAmong: [to], 
      share: parseFloat(amount),
      group: groupId || null, // Null if settling a friend debt outside a group
      creator: req.user.id
    });

    await newSettlement.save();
    res.json({ msg: 'Settlement recorded successfully' });
  } catch (err) {
    console.error("Settle Up Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    // Ensure only the creator can delete it
    if (expense.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();
    res.json({ msg: 'Expense removed' });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/expenses/global-stats
// @desc    Get accurate global stats by calculating individual debts first
router.get('/global-stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Fetch ALL expenses involving the user (across all groups and 1-on-1s)
    const userExpenses = await Expense.find({
      $or: [
        { payer: user.name },
        { splitAmong: user.name }
      ]
    });

    // We will track the user's exact balance with every single person
    const personBalances = {};

    userExpenses.forEach(exp => {
      const isPayer = exp.payer === user.name;
      const isMember = exp.splitAmong.includes(user.name);
      
      if (isPayer) {
         // You paid. Everyone else in the split owes you their share.
         exp.splitAmong.forEach(person => {
            if (person !== user.name) {
               if (!personBalances[person]) personBalances[person] = 0;
               personBalances[person] += exp.share; // They owe you (+)
            }
         });
      } else if (isMember) {
         // Someone else paid, and you were involved. You owe the payer your share.
         const payerName = exp.payer;
         if (!personBalances[payerName]) personBalances[payerName] = 0;
         personBalances[payerName] -= exp.share; // You owe them (-)
      }
    });

    let totalLent = 0;
    let totalOwed = 0;

    // Now, we evaluate your final relationship with each person globally
    for (let person in personBalances) {
       const balanceWithPerson = personBalances[person];
       
       // If the final math says they owe you money, add it to Total Lent
       if (balanceWithPerson > 0.01) {
          totalLent += balanceWithPerson;
       } 
       // If the final math says you owe them money, add it to Total Owed
       else if (balanceWithPerson < -0.01) {
          totalOwed += Math.abs(balanceWithPerson);
       }
    }

    res.json({
      netBalance: totalLent - totalOwed,
      totalLent,
      totalOwed
    });
    
  } catch (err) {
    console.error("Global Stats Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
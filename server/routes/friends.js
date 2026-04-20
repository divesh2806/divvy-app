const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/friends
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name email');
    res.json(user.friends);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/friends/add
router.post('/add', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const friend = await User.findOne({ email: email.toLowerCase().trim() });

    if (!friend) return res.status(404).json({ msg: 'User not found' });
    if (friend.id === req.user.id) return res.status(400).json({ msg: 'Cannot add yourself' });

    const user = await User.findById(req.user.id);
    if (user.friends.includes(friend.id)) return res.status(400).json({ msg: 'Already friends' });

    user.friends.push(friend.id);
    friend.friends.push(user.id); // Mutual friendship
    await user.save();
    await friend.save();

    res.json(friend);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');

// @route   POST api/groups/add
// @desc    Create a new group and validate member emails
router.post('/add', auth, async (req, res) => {
  try {
    const { name, members } = req.body; 

    if (!name) {
      return res.status(400).json({ msg: 'Group name is required' });
    }

    const memberIds = [req.user.id]; // Automatically include the creator

    // Handle members input (string or array)
    const emails = Array.isArray(members) ? members : members.split(',').map(m => m.trim());

    for (let email of emails) {
      if (!email) continue;
      
      const foundUser = await User.findOne({ email: email.toLowerCase() });
      
      if (!foundUser) {
        return res.status(400).json({ msg: `User with email ${email} not found` });
      }

      // Add to list if not already present (and not the creator)
      if (foundUser._id.toString() !== req.user.id && !memberIds.includes(foundUser._id.toString())) {
        memberIds.push(foundUser._id);
      }
    }

    const newGroup = new Group({
      name,
      creator: req.user.id,
      members: memberIds
    });

    const group = await newGroup.save();
    const populatedGroup = await Group.findById(group._id).populate('members', 'name email');
    
    res.json(populatedGroup);
  } catch (err) {
    console.error("Create Group Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/groups
// @desc    Get all groups where the user is a member
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ 
      members: req.user.id 
    })
    .sort({ date: -1 })
    .populate('members', 'name email');

    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/groups/:id/add-member
// @desc    Add a single member to an existing group by email
router.put('/:id/add-member', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Authorization: Only existing members can add others
    if (!group.members.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized to add members to this group' });
    }

    const userToAdd = await User.findOne({ email: cleanEmail });
    if (!userToAdd) {
      return res.status(400).json({ msg: `User ${email} not found. They must register first.` });
    }

    // Check if user is already in group
    const isAlreadyMember = group.members.some(m => m.toString() === userToAdd._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ msg: 'User is already a member of this group' });
    }

    group.members.push(userToAdd._id);
    await group.save();

    const updatedGroup = await Group.findById(group._id).populate('members', 'name email');
    res.json(updatedGroup);
  } catch (err) {
    console.error("Add Member Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/groups/:id
// @desc    Delete a group (Creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Check if user is the creator
    if (group.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the creator can delete this group' });
    }

    await group.deleteOne();
    res.json({ msg: 'Group removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
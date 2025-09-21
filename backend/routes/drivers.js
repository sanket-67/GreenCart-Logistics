const express = require('express');
const Driver = require('../models/Driver');
const { authenticateToken } = require('../middleware/auth');
const { validateDriver } = require('../middleware/validation');

const router = express.Router();

// Get all drivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const drivers = await Driver.find({}).sort({ name: 1 });
    res.json({ drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get driver by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ driver });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// Create new driver
router.post('/', authenticateToken, validateDriver, async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    res.status(201).json({ message: 'Driver created successfully', driver });
  } catch (error) {
    console.error('Create driver error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Driver with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Update driver
router.put('/:id', authenticateToken, validateDriver, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver updated successfully', driver });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// Delete driver
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

module.exports = router;
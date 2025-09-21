const express = require('express');
const Route = require('../models/Route');
const { authenticateToken } = require('../middleware/auth');
const { validateRoute } = require('../middleware/validation');

const router = express.Router();

// Get all routes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = await Route.find({}).sort({ routeId: 1 });
    res.json({ routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get route by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// Create new route
router.post('/', authenticateToken, validateRoute, async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json({ message: 'Route created successfully', route });
  } catch (error) {
    console.error('Create route error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Route ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// Update route
router.put('/:id', authenticateToken, validateRoute, async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ message: 'Route updated successfully', route });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// Delete route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

module.exports = router;
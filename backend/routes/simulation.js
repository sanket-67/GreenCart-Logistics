const express = require('express');
const SimulationEngine = require('../utils/simulationEngine');
const Simulation = require('../models/Simulation');
const { authenticateToken } = require('../middleware/auth');
const { validateSimulation } = require('../middleware/validation');

const router = express.Router();

// Run new simulation
router.post('/run', authenticateToken, validateSimulation, async (req, res) => {
  try {
    const { numberOfDrivers, startTime, maxHoursPerDriver } = req.body;

    // Validate inputs
    if (numberOfDrivers <= 0) {
      return res.status(400).json({ error: 'Number of drivers must be positive' });
    }

    if (maxHoursPerDriver <= 0 || maxHoursPerDriver > 24) {
      return res.status(400).json({ error: 'Max hours per driver must be between 1 and 24' });
    }

    // Run simulation
    const simulationEngine = new SimulationEngine();
    const { assignments, results } = await simulationEngine.runSimulation({
      numberOfDrivers,
      startTime,
      maxHoursPerDriver
    });

    // Save simulation result
    const simulation = new Simulation({
      userId: req.user._id,
      inputs: {
        numberOfDrivers,
        startTime,
        maxHoursPerDriver
      },
      results: {
        totalProfit: results.totalProfit,
        efficiencyScore: results.efficiencyScore,
        onTimeDeliveries: results.onTimeDeliveries,
        lateDeliveries: results.lateDeliveries,
        totalDeliveries: results.totalDeliveries,
        fuelCostBreakdown: results.fuelCostBreakdown,
        driverAssignments: assignments.map(assignment => ({
          driverId: assignment.driverId,
          assignedOrders: assignment.assignedOrders.map(order => order._id),
          totalHours: assignment.totalHours
        }))
      }
    });

    await simulation.save();

    res.json({
      simulationId: simulation._id,
      inputs: simulation.inputs,
      results: {
        ...results,
        assignments: assignments.map(assignment => ({
          driverId: assignment.driverId,
          driverName: assignment.driverName,
          totalHours: Math.round(assignment.totalHours * 100) / 100,
          assignedOrdersCount: assignment.assignedOrders.length,
          assignedOrders: assignment.assignedOrders.map(order => ({
            orderId: order.orderId,
            valueRs: order.valueRs,
            routeId: order.routeId,
            deliveryTime: order.deliveryTime,
            isLate: order.isLate,
            estimatedTime: order.estimatedTime
          }))
        }))
      }
    });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ 
      error: 'Simulation failed',
      message: error.message 
    });
  }
});

// Get simulation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const simulations = await Simulation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('inputs results.totalProfit results.efficiencyScore createdAt');

    const totalSimulations = await Simulation.countDocuments({ userId: req.user._id });
    const totalPages = Math.ceil(totalSimulations / limit);

    res.json({
      simulations: simulations.map(sim => ({
        id: sim._id,
        inputs: sim.inputs,
        totalProfit: sim.results.totalProfit,
        efficiencyScore: sim.results.efficiencyScore,
        createdAt: sim.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalSimulations,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get simulation history error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation history' });
  }
});

// Get specific simulation details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const simulation = await Simulation.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate({
      path: 'results.driverAssignments.driverId',
      select: 'name'
    }).populate({
      path: 'results.driverAssignments.assignedOrders',
      select: 'orderId valueRs routeId deliveryTime'
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json({
      id: simulation._id,
      inputs: simulation.inputs,
      results: simulation.results,
      createdAt: simulation.createdAt
    });

  } catch (error) {
    console.error('Get simulation details error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation details' });
  }
});

// Delete simulation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const simulation = await Simulation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json({ message: 'Simulation deleted successfully' });

  } catch (error) {
    console.error('Delete simulation error:', error);
    res.status(500).json({ error: 'Failed to delete simulation' });
  }
});

// Get simulation statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalSimulations = await Simulation.countDocuments({ userId: req.user._id });
    
    const profitStats = await Simulation.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          avgProfit: { $avg: '$results.totalProfit' },
          maxProfit: { $max: '$results.totalProfit' },
          minProfit: { $min: '$results.totalProfit' },
          avgEfficiency: { $avg: '$results.efficiencyScore' }
        }
      }
    ]);

    const stats = profitStats[0] || {
      avgProfit: 0,
      maxProfit: 0,
      minProfit: 0,
      avgEfficiency: 0
    };

    res.json({
      totalSimulations,
      averageProfit: Math.round(stats.avgProfit),
      maxProfit: stats.maxProfit,
      minProfit: stats.minProfit,
      averageEfficiency: Math.round(stats.avgEfficiency * 100) / 100
    });

  } catch (error) {
    console.error('Get simulation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation statistics' });
  }
});

module.exports = router;
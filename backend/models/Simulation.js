const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputs: {
    numberOfDrivers: {
      type: Number,
      required: true,
      min: 1
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(time) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    maxHoursPerDriver: {
      type: Number,
      required: true,
      min: 1,
      max: 24
    }
  },
  results: {
    totalProfit: {
      type: Number,
      required: true
    },
    efficiencyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    onTimeDeliveries: {
      type: Number,
      required: true,
      min: 0
    },
    lateDeliveries: {
      type: Number,
      required: true,
      min: 0
    },
    totalDeliveries: {
      type: Number,
      required: true,
      min: 0
    },
    fuelCostBreakdown: {
      lowTraffic: { type: Number, default: 0 },
      mediumTraffic: { type: Number, default: 0 },
      highTraffic: { type: Number, default: 0 }
    },
    driverAssignments: [{
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
      },
      assignedOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      }],
      totalHours: Number
    }]
  }
}, {
  timestamps: true
});

// Get total fuel cost
simulationSchema.methods.getTotalFuelCost = function() {
  const breakdown = this.results.fuelCostBreakdown;
  return breakdown.lowTraffic + breakdown.mediumTraffic + breakdown.highTraffic;
};

module.exports = mongoose.model('Simulation', simulationSchema);
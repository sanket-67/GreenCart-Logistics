const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: Number,
    required: true,
    unique: true
  },
  distanceKm: {
    type: Number,
    required: true,
    min: 0
  },
  trafficLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High']
  },
  baseTimeMin: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Calculate fuel cost for this route
routeSchema.methods.calculateFuelCost = function() {
  const baseCost = this.distanceKm * 5; // ₹5/km base cost
  const surcharge = this.trafficLevel === 'High' ? this.distanceKm * 2 : 0; // +₹2/km for high traffic
  return baseCost + surcharge;
};

// Calculate expected delivery time with traffic
routeSchema.methods.getExpectedTime = function() {
  const trafficMultiplier = {
    'Low': 1,
    'Medium': 1.2,
    'High': 1.5
  };
  return Math.ceil(this.baseTimeMin * trafficMultiplier[this.trafficLevel]);
};

module.exports = mongoose.model('Route', routeSchema);
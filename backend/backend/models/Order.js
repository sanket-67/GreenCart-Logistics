const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required: true,
    unique: true
  },
  valueRs: {
    type: Number,
    required: true,
    min: 0
  },
  routeId: {
    type: Number,
    required: true,
    ref: 'Route'
  },
  deliveryTime: {
    type: String,
    required: true,
    validate: {
      validator: function(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Delivery time must be in HH:MM format'
    }
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-transit', 'delivered', 'failed'],
    default: 'pending'
  },
  actualDeliveryTime: {
    type: Date
  },
  isLate: {
    type: Boolean,
    default: false
  },
  penalty: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Convert delivery time string to minutes
orderSchema.methods.getDeliveryTimeInMinutes = function() {
  const [hours, minutes] = this.deliveryTime.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check if order is high value (>₹1000)
orderSchema.methods.isHighValue = function() {
  return this.valueRs > 1000;
};

// Calculate profit for this order
orderSchema.methods.calculateProfit = function(route) {
  let profit = this.valueRs;
  
  // Add bonus for high-value orders delivered on time
  if (this.isHighValue() && !this.isLate) {
    profit += this.valueRs * 0.1; // 10% bonus
  }
  
  // Subtract penalties and fuel cost
  profit -= this.penalty;
  if (route) {
    profit -= route.calculateFuelCost();
  }
  
  return Math.max(0, profit);
};

module.exports = mongoose.model('Order', orderSchema);
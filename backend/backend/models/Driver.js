const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shiftHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  pastWeekHours: {
    type: [Number],
    required: true,
    validate: {
      validator: function(hours) {
        return hours.length === 7 && hours.every(h => h >= 0 && h <= 24);
      },
      message: 'Past week hours must be an array of 7 numbers between 0 and 24'
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentDayHours: {
    type: Number,
    default: 0,
    min: 0
  },
  fatigueLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Calculate if driver is fatigued (worked >8 hours yesterday)
driverSchema.methods.isFatigued = function() {
  const yesterdayHours = this.pastWeekHours[this.pastWeekHours.length - 1];
  return yesterdayHours > 8;
};

// Get average hours worked in past week
driverSchema.methods.getWeeklyAverage = function() {
  const total = this.pastWeekHours.reduce((sum, hours) => sum + hours, 0);
  return total / 7;
};

module.exports = mongoose.model('Driver', driverSchema);
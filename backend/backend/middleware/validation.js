const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Driver validation
const validateDriver = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('shiftHours')
    .isInt({ min: 0, max: 24 })
    .withMessage('Shift hours must be between 0 and 24'),
  body('pastWeekHours')
    .isArray({ min: 7, max: 7 })
    .withMessage('Past week hours must be an array of exactly 7 numbers')
    .custom((hours) => {
      return hours.every(h => typeof h === 'number' && h >= 0 && h <= 24);
    })
    .withMessage('Each hour value must be between 0 and 24'),
  handleValidationErrors
];

// Route validation
const validateRoute = [
  body('routeId')
    .isInt({ min: 1 })
    .withMessage('Route ID must be a positive integer'),
  body('distanceKm')
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('trafficLevel')
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Traffic level must be Low, Medium, or High'),
  body('baseTimeMin')
    .isInt({ min: 0 })
    .withMessage('Base time must be a positive integer'),
  handleValidationErrors
];

// Order validation
const validateOrder = [
  body('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  body('valueRs')
    .isFloat({ min: 0 })
    .withMessage('Order value must be a positive number'),
  body('routeId')
    .isInt({ min: 1 })
    .withMessage('Route ID must be a positive integer'),
  body('deliveryTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Delivery time must be in HH:MM format'),
  handleValidationErrors
];

// Simulation validation
const validateSimulation = [
  body('numberOfDrivers')
    .isInt({ min: 1 })
    .withMessage('Number of drivers must be at least 1'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('maxHoursPerDriver')
    .isInt({ min: 1, max: 24 })
    .withMessage('Max hours per driver must be between 1 and 24'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateDriver,
  validateRoute,
  validateOrder,
  validateSimulation,
  handleValidationErrors
};
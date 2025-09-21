const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Order = require('../models/Order');

class SimulationEngine {
  constructor() {
    this.LATE_DELIVERY_PENALTY = 50; // ₹50 penalty
    this.HIGH_VALUE_BONUS_RATE = 0.1; // 10% bonus
    this.BASE_FUEL_COST = 5; // ₹5/km
    this.HIGH_TRAFFIC_SURCHARGE = 2; // +₹2/km for high traffic
    this.FATIGUE_SPEED_REDUCTION = 0.3; // 30% speed reduction when fatigued
  }

  /**
   * Main simulation method
   * @param {Object} inputs - Simulation parameters
   * @returns {Object} - Simulation results with KPIs
   */
  async runSimulation(inputs) {
    const { numberOfDrivers, startTime, maxHoursPerDriver } = inputs;

    // Get available drivers and sort by efficiency
    const drivers = await Driver.find({ isAvailable: true })
      .limit(numberOfDrivers)
      .sort({ fatigueLevel: 1, currentDayHours: 1 });

    if (drivers.length < numberOfDrivers) {
      throw new Error(`Only ${drivers.length} drivers available, but ${numberOfDrivers} requested`);
    }

    // Get all orders and routes
    const [orders, routes] = await Promise.all([
      Order.find({ status: 'pending' }),
      Route.find({})
    ]);

    // Create route lookup
    const routeMap = new Map();
    routes.forEach(route => routeMap.set(route.routeId, route));

    // Assign orders to drivers using optimization algorithm
    const assignments = this.optimizeOrderAssignment(
      drivers,
      orders,
      routeMap,
      startTime,
      maxHoursPerDriver
    );

    // Calculate KPIs based on assignments
    const results = this.calculateKPIs(assignments, routeMap);

    return {
      assignments,
      results
    };
  }

  /**
   * Optimizes order assignment to drivers based on various factors
   */
  optimizeOrderAssignment(drivers, orders, routeMap, startTime, maxHoursPerDriver) {
    const assignments = drivers.map(driver => ({
      driverId: driver._id,
      driverName: driver.name,
      assignedOrders: [],
      totalHours: 0,
      isFatigued: driver.isFatigued()
    }));

    // Sort orders by value (high value first) and delivery time
    const sortedOrders = orders.sort((a, b) => {
      if (a.valueRs !== b.valueRs) return b.valueRs - a.valueRs;
      return a.getDeliveryTimeInMinutes() - b.getDeliveryTimeInMinutes();
    });

    // Convert start time to minutes
    const startTimeMinutes = this.timeToMinutes(startTime);
    const maxMinutes = maxHoursPerDriver * 60;

    // Assign orders using greedy algorithm
    for (const order of sortedOrders) {
      const route = routeMap.get(order.routeId);
      if (!route) continue;

      // Find best driver for this order
      let bestDriverIndex = -1;
      let bestScore = -1;

      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        
        // Check if driver has capacity
        const orderTime = this.calculateOrderTime(route, assignment.isFatigued);
        if (assignment.totalHours + orderTime/60 > maxHoursPerDriver) continue;

        // Calculate efficiency score for this assignment
        const score = this.calculateAssignmentScore(assignment, order, route);
        
        if (score > bestScore) {
          bestScore = score;
          bestDriverIndex = i;
        }
      }

      // Assign order to best driver if found
      if (bestDriverIndex !== -1) {
        const assignment = assignments[bestDriverIndex];
        const route = routeMap.get(order.routeId);
        const orderTime = this.calculateOrderTime(route, assignment.isFatigued);
        
        assignment.assignedOrders.push({
          ...order.toObject(),
          estimatedTime: orderTime,
          isLate: this.isOrderLate(order, route, assignment.isFatigued)
        });
        
        assignment.totalHours += orderTime / 60;
      }
    }

    return assignments;
  }

  /**
   * Calculate assignment score for driver-order pairing
   */
  calculateAssignmentScore(assignment, order, route) {
    let score = 100; // Base score

    // Penalize fatigued drivers
    if (assignment.isFatigued) score -= 30;

    // Prefer drivers with lower current workload
    score -= assignment.totalHours * 2;

    // Bonus for high-value orders
    if (order.valueRs > 1000) score += 20;

    // Penalize high traffic routes
    if (route.trafficLevel === 'High') score -= 10;
    else if (route.trafficLevel === 'Medium') score -= 5;

    return score;
  }

  /**
   * Calculate estimated time for an order considering driver fatigue
   */
  calculateOrderTime(route, isFatigued) {
    let baseTime = route.getExpectedTime();
    
    // Apply fatigue penalty
    if (isFatigued) {
      baseTime *= (1 + this.FATIGUE_SPEED_REDUCTION);
    }

    return Math.ceil(baseTime);
  }

  /**
   * Check if order will be delivered late
   */
  isOrderLate(order, route, isFatigued) {
    const expectedTime = this.calculateOrderTime(route, isFatigued);
    const allowedTime = route.baseTimeMin + 10; // 10 minute buffer
    return expectedTime > allowedTime;
  }

  /**
   * Calculate comprehensive KPIs from assignments
   */
  calculateKPIs(assignments, routeMap) {
    let totalProfit = 0;
    let totalFuelCost = 0;
    let onTimeDeliveries = 0;
    let lateDeliveries = 0;
    let totalDeliveries = 0;

    const fuelCostBreakdown = {
      lowTraffic: 0,
      mediumTraffic: 0,
      highTraffic: 0
    };

    // Process each assignment
    for (const assignment of assignments) {
      for (const order of assignment.assignedOrders) {
        const route = routeMap.get(order.routeId);
        if (!route) continue;

        totalDeliveries++;

        // Calculate profit for this order
        let orderProfit = order.valueRs;

        // Apply late delivery penalty
        if (order.isLate) {
          orderProfit -= this.LATE_DELIVERY_PENALTY;
          lateDeliveries++;
        } else {
          onTimeDeliveries++;
          
          // Apply high-value bonus for on-time delivery
          if (order.valueRs > 1000) {
            orderProfit += order.valueRs * this.HIGH_VALUE_BONUS_RATE;
          }
        }

        // Calculate fuel cost
        const fuelCost = this.calculateFuelCost(route);
        orderProfit -= fuelCost;
        totalFuelCost += fuelCost;

        // Update fuel cost breakdown
        const trafficKey = route.trafficLevel.toLowerCase() + 'Traffic';
        fuelCostBreakdown[trafficKey] += fuelCost;

        totalProfit += Math.max(0, orderProfit);
      }
    }

    // Calculate efficiency score
    const efficiencyScore = totalDeliveries > 0 
      ? (onTimeDeliveries / totalDeliveries) * 100 
      : 0;

    return {
      totalProfit: Math.round(totalProfit),
      efficiencyScore: Math.round(efficiencyScore * 100) / 100,
      onTimeDeliveries,
      lateDeliveries,
      totalDeliveries,
      totalFuelCost: Math.round(totalFuelCost),
      fuelCostBreakdown: {
        lowTraffic: Math.round(fuelCostBreakdown.lowTraffic),
        mediumTraffic: Math.round(fuelCostBreakdown.mediumTraffic),
        highTraffic: Math.round(fuelCostBreakdown.highTraffic)
      }
    };
  }

  /**
   * Calculate fuel cost for a route
   */
  calculateFuelCost(route) {
    let cost = route.distanceKm * this.BASE_FUEL_COST;
    
    if (route.trafficLevel === 'High') {
      cost += route.distanceKm * this.HIGH_TRAFFIC_SURCHARGE;
    }
    
    return cost;
  }

  /**
   * Convert time string (HH:MM) to minutes
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

module.exports = SimulationEngine;
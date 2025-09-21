const SimulationEngine = require('../backend/utils/simulationEngine');

describe('SimulationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  describe('timeToMinutes', () => {
    test('should convert time string to minutes correctly', () => {
      expect(engine.timeToMinutes('09:00')).toBe(540);
      expect(engine.timeToMinutes('12:30')).toBe(750);
      expect(engine.timeToMinutes('00:00')).toBe(0);
      expect(engine.timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTime', () => {
    test('should convert minutes to time string correctly', () => {
      expect(engine.minutesToTime(540)).toBe('09:00');
      expect(engine.minutesToTime(750)).toBe('12:30');
      expect(engine.minutesToTime(0)).toBe('00:00');
      expect(engine.minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('calculateFuelCost', () => {
    test('should calculate fuel cost correctly for low traffic', () => {
      const route = {
        distanceKm: 10,
        trafficLevel: 'Low'
      };
      expect(engine.calculateFuelCost(route)).toBe(50); // 10 * 5
    });

    test('should calculate fuel cost correctly for high traffic', () => {
      const route = {
        distanceKm: 10,
        trafficLevel: 'High'
      };
      expect(engine.calculateFuelCost(route)).toBe(70); // (10 * 5) + (10 * 2)
    });

    test('should calculate fuel cost correctly for medium traffic', () => {
      const route = {
        distanceKm: 15,
        trafficLevel: 'Medium'
      };
      expect(engine.calculateFuelCost(route)).toBe(75); // 15 * 5, no surcharge for medium
    });
  });

  describe('calculateOrderTime', () => {
    test('should calculate order time without fatigue', () => {
      const route = {
        getExpectedTime: () => 60
      };
      expect(engine.calculateOrderTime(route, false)).toBe(60);
    });

    test('should calculate order time with fatigue penalty', () => {
      const route = {
        getExpectedTime: () => 60
      };
      const expectedTime = Math.ceil(60 * (1 + 0.3)); // 30% increase due to fatigue
      expect(engine.calculateOrderTime(route, true)).toBe(expectedTime);
    });
  });

  describe('isOrderLate', () => {
    test('should identify late orders correctly', () => {
      const order = {};
      const route = {
        baseTimeMin: 60,
        getExpectedTime: () => 80
      };
      
      // Order taking 80 minutes when base time is 60 + 10 buffer = 70 minutes allowed
      expect(engine.isOrderLate(order, route, false)).toBe(true);
    });

    test('should identify on-time orders correctly', () => {
      const order = {};
      const route = {
        baseTimeMin: 60,
        getExpectedTime: () => 65
      };
      
      // Order taking 65 minutes when 70 minutes allowed (60 + 10 buffer)
      expect(engine.isOrderLate(order, route, false)).toBe(false);
    });
  });

  describe('calculateAssignmentScore', () => {
    test('should calculate assignment score correctly', () => {
      const assignment = {
        isFatigued: false,
        totalHours: 2
      };
      const order = {
        valueRs: 1500 // High value order
      };
      const route = {
        trafficLevel: 'Low'
      };

      const score = engine.calculateAssignmentScore(assignment, order, route);
      // Base score (100) - workload penalty (2*2=4) + high value bonus (20) = 116
      expect(score).toBe(116);
    });

    test('should penalize fatigued drivers', () => {
      const assignment = {
        isFatigued: true,
        totalHours: 0
      };
      const order = {
        valueRs: 500
      };
      const route = {
        trafficLevel: 'Low'
      };

      const score = engine.calculateAssignmentScore(assignment, order, route);
      // Base score (100) - fatigue penalty (30) = 70
      expect(score).toBe(70);
    });

    test('should penalize high traffic routes', () => {
      const assignment = {
        isFatigued: false,
        totalHours: 0
      };
      const order = {
        valueRs: 500
      };
      const route = {
        trafficLevel: 'High'
      };

      const score = engine.calculateAssignmentScore(assignment, order, route);
      // Base score (100) - high traffic penalty (10) = 90
      expect(score).toBe(90);
    });
  });
});

describe('Business Logic Constants', () => {
  test('should have correct penalty and bonus constants', () => {
    const engine = new SimulationEngine();
    expect(engine.LATE_DELIVERY_PENALTY).toBe(50);
    expect(engine.HIGH_VALUE_BONUS_RATE).toBe(0.1);
    expect(engine.BASE_FUEL_COST).toBe(5);
    expect(engine.HIGH_TRAFFIC_SURCHARGE).toBe(2);
    expect(engine.FATIGUE_SPEED_REDUCTION).toBe(0.3);
  });
});
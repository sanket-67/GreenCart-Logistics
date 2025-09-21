const fs = require('fs').promises;
const path = require('path');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Order = require('../models/Order');
const User = require('../models/User');

class DataSeeder {
  /**
   * Parse CSV data from string
   */
  parseCsv(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1)
      .filter(line => line.trim() && !line.startsWith('|')) // Filter empty lines and pipe-separated lines
      .map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            row[header.trim()] = values[index].trim();
          }
        });
        return row;
      });
  }

  /**
   * Parse pipe-separated CSV format from the provided data
   */
  parsePipeCsv(csvData) {
    const lines = csvData.trim().split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('|') || line.includes('name,shift_hours') || line.includes('order_id,value_rs') || line.includes('route_id,distance_km')) {
        continue;
      }
      
      // Remove leading pipe and split by pipe
      const parts = line.substring(1).split('|');
      if (parts.length > 1) {
        result.push(parts);
      }
    }
    
    return result;
  }

  /**
   * Seed drivers from CSV data
   */
  async seedDrivers() {
    try {
      console.log('Seeding drivers...');
      
      const csvPath = path.join(__dirname, '../../drivers.csv');
      const csvData = await fs.readFile(csvPath, 'utf-8');
      
      // Parse the pipe-separated format
      const rows = this.parsePipeCsv(csvData);
      
      const driversToInsert = [];
      
      for (const row of rows) {
        if (row.length >= 3) {
          const name = row[0];
          const shiftHours = parseInt(row[1]);
          const pastWeekData = row[2];
          
          if (name && !isNaN(shiftHours) && pastWeekData) {
            const pastWeekHours = pastWeekData.split('|').map(h => parseInt(h)).filter(h => !isNaN(h));
            
            if (pastWeekHours.length === 7) {
              driversToInsert.push({
                name,
                shiftHours,
                pastWeekHours,
                isAvailable: true,
                currentDayHours: 0,
                fatigueLevel: pastWeekHours[pastWeekHours.length - 1] > 8 ? 30 : 0
              });
            }
          }
        }
      }
      
      // Clear existing drivers and insert new ones
      await Driver.deleteMany({});
      const drivers = await Driver.insertMany(driversToInsert);
      console.log(`Successfully seeded ${drivers.length} drivers`);
      
      return drivers;
    } catch (error) {
      console.error('Error seeding drivers:', error);
      throw error;
    }
  }

  /**
   * Seed routes from CSV data
   */
  async seedRoutes() {
    try {
      console.log('Seeding routes...');
      
      const csvPath = path.join(__dirname, '../../routes.csv');
      const csvData = await fs.readFile(csvPath, 'utf-8');
      
      // Parse the pipe-separated format
      const rows = this.parsePipeCsv(csvData);
      
      const routesToInsert = [];
      
      for (const row of rows) {
        if (row.length >= 4) {
          const routeId = parseInt(row[0]);
          const distanceKm = parseInt(row[1]);
          const trafficLevel = row[2];
          const baseTimeMin = parseInt(row[3]);
          
          if (!isNaN(routeId) && !isNaN(distanceKm) && trafficLevel && !isNaN(baseTimeMin)) {
            routesToInsert.push({
              routeId,
              distanceKm,
              trafficLevel,
              baseTimeMin
            });
          }
        }
      }
      
      // Clear existing routes and insert new ones
      await Route.deleteMany({});
      const routes = await Route.insertMany(routesToInsert);
      console.log(`Successfully seeded ${routes.length} routes`);
      
      return routes;
    } catch (error) {
      console.error('Error seeding routes:', error);
      throw error;
    }
  }

  /**
   * Seed orders from CSV data
   */
  async seedOrders() {
    try {
      console.log('Seeding orders...');
      
      const csvPath = path.join(__dirname, '../../orders.csv');
      const csvData = await fs.readFile(csvPath, 'utf-8');
      
      // Parse the pipe-separated format
      const rows = this.parsePipeCsv(csvData);
      
      const ordersToInsert = [];
      
      for (const row of rows) {
        if (row.length >= 4) {
          const orderId = parseInt(row[0]);
          const valueRs = parseInt(row[1]);
          const routeId = parseInt(row[2]);
          const deliveryTime = row[3];
          
          if (!isNaN(orderId) && !isNaN(valueRs) && !isNaN(routeId) && deliveryTime) {
            ordersToInsert.push({
              orderId,
              valueRs,
              routeId,
              deliveryTime,
              status: 'pending'
            });
          }
        }
      }
      
      // Clear existing orders and insert new ones
      await Order.deleteMany({});
      const orders = await Order.insertMany(ordersToInsert);
      console.log(`Successfully seeded ${orders.length} orders`);
      
      return orders;
    } catch (error) {
      console.error('Error seeding orders:', error);
      throw error;
    }
  }

  /**
   * Create default admin user
   */
  async seedDefaultUser() {
    try {
      console.log('Creating default admin user...');
      
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ email: 'admin@greencart.com' });
      if (existingAdmin) {
        console.log('Admin user already exists');
        return existingAdmin;
      }
      
      const adminUser = new User({
        name: 'GreenCart Admin',
        email: 'admin@greencart.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Default admin user created successfully');
      console.log('Login credentials: admin@greencart.com / admin123');
      
      return adminUser;
    } catch (error) {
      console.error('Error creating default user:', error);
      throw error;
    }
  }

  /**
   * Seed all data
   */
  async seedAll() {
    try {
      console.log('Starting data seeding...');
      
      const [drivers, routes, orders, user] = await Promise.all([
        this.seedDrivers(),
        this.seedRoutes(),
        this.seedOrders(),
        this.seedDefaultUser()
      ]);
      
      console.log('Data seeding completed successfully!');
      console.log(`Seeded ${drivers.length} drivers, ${routes.length} routes, ${orders.length} orders`);
      
      return { drivers, routes, orders, user };
    } catch (error) {
      console.error('Error during data seeding:', error);
      throw error;
    }
  }
}

module.exports = DataSeeder;
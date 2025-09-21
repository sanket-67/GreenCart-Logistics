const mongoose = require('mongoose');
const DataSeeder = require('../backend/utils/dataSeeder');
require('dotenv').config();

async function runSeeder() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greencart', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Database connected successfully');
    
    const seeder = new DataSeeder();
    await seeder.seedAll();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('🔑 Default login credentials:');
    console.log('   Email: admin@greencart.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { runSeeder };
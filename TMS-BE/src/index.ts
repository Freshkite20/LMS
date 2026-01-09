import app from './app.js';

import { connectDB } from './db/mongoose.js';
import { config } from './config/env.js';



// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
  } catch (error: any) {
    console.error('\n❌ Database connection failed:');
    console.error('Error message:', error?.message || 'Unknown error');
    process.exit(1);
  }
}

// Test DB connection before starting server
testDatabaseConnection().then(() => {
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 TMS API listening on port ${config.port}`);
  });
});

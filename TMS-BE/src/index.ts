import app from './app.js';
import { loadEnv } from './config/env.js';
import { connectDB } from './db/mongoose.js';

loadEnv();

const PORT = 3000; // Force 3001 to resolve port conflict

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
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 TMS API listening on port ${PORT}`);
  });
});

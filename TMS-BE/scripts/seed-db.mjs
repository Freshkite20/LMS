#!/usr/bin/env node

/**
 * Database Seed Script
 * Seeds the database with initial data for development/testing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(rootDir, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tms';

console.log('🌱 Starting database seed...');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import models (adjust paths as needed)
        const { default: User } = await import('../dist/models/User.js');
        const { default: Course } = await import('../dist/models/Course.js');
        const { default: Batch } = await import('../dist/models/Batch.js');

        // Clear existing data (optional - comment out if you want to preserve data)
        console.log('\n🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Batch.deleteMany({});
        console.log('✅ Cleared existing data');

        // Seed users
        console.log('\n👥 Seeding users...');
        const users = await User.insertMany([
            {
                email: 'admin@tms.com',
                name: 'Admin User',
                role: 'admin',
                password: '$2a$10$YourHashedPasswordHere', // Use bcrypt to hash
            },
            {
                email: 'instructor@tms.com',
                name: 'John Instructor',
                role: 'instructor',
                password: '$2a$10$YourHashedPasswordHere',
            },
            {
                email: 'student@tms.com',
                name: 'Jane Student',
                role: 'student',
                password: '$2a$10$YourHashedPasswordHere',
            },
        ]);
        console.log(`✅ Created ${users.length} users`);

        // Seed courses
        console.log('\n📚 Seeding courses...');
        const courses = await Course.insertMany([
            {
                title: 'Introduction to Programming',
                description: 'Learn the basics of programming with JavaScript',
                instructor_id: users[1]._id,
                duration: 40,
            },
            {
                title: 'Web Development Fundamentals',
                description: 'Master HTML, CSS, and JavaScript',
                instructor_id: users[1]._id,
                duration: 60,
            },
        ]);
        console.log(`✅ Created ${courses.length} courses`);

        // Seed batches
        console.log('\n🎓 Seeding batches...');
        const batches = await Batch.insertMany([
            {
                name: 'Batch 2024-A',
                start_date: new Date('2024-01-15'),
                end_date: new Date('2024-06-15'),
            },
            {
                name: 'Batch 2024-B',
                start_date: new Date('2024-07-01'),
                end_date: new Date('2024-12-31'),
            },
        ]);
        console.log(`✅ Created ${batches.length} batches`);

        console.log('\n🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

seedDatabase();

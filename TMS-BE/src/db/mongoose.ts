import mongoose from 'mongoose';
import { config } from '../config/env.js';

export const connectDB = async () => {
    try {
        if (!config.mongo.uri) {
            throw new Error('MONGODB_URI is not configured');
        }

        const conn = await mongoose.connect(config.mongo.uri, {
            dbName: config.mongo.dbName,
        });

        //console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

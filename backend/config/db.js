const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const atlasUri = process.env.MONGO_URI || process.env.ATLAS_MONGO_URI || 'mongodb+srv://mekharamesh3_db_user:mekha142004@cluster0.oq5fgf6.mongodb.net/?appName=Cluster0';
const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/woodentoy';
const useLocalFallback = process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';

const connectDB = async () => {
    const uri = atlasUri || (useLocalFallback ? localUri : '');

    if (!uri) {
        console.error('No MongoDB URI configured. Set MONGO_URI or ATLAS_MONGO_URI in your environment.');
        process.exit(1);
    }

    try {
        const target = uri === atlasUri ? 'Atlas MongoDB' : 'localhost MongoDB';
        console.log(`Attempting to connect to ${target}...`);
        const conn = await mongoose.connect(uri, {
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            },
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        });

        const isLocal = conn.connection.host.includes('127.0.0.1') || conn.connection.host.includes('localhost');
        console.log(`MongoDB Connected (${isLocal ? 'Localhost' : 'Atlas'}): ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);

        if (uri === atlasUri && useLocalFallback) {
            try {
                console.log('Falling back to localhost MongoDB...');
                const localConn = await mongoose.connect(localUri);
                console.log(`MongoDB Connected (Localhost): ${localConn.connection.host}`);
            } catch (localError) {
                console.error(`Localhost fallback also failed: ${localError.message}`);
                process.exit(1);
            }
            return;
        }

        process.exit(1);
    }
};

module.exports = connectDB;

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const atlasUri = process.env.MONGO_URI || process.env.ATLAS_MONGO_URI || '';
const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/woodentoy';
const useLocalFallback = process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';

const connectDB = async () => {
    const uri = atlasUri || (useLocalFallback ? localUri : '');

    if (!uri) {
        logger.error('No MongoDB URI configured. Set MONGO_URI or ATLAS_MONGO_URI in your environment.');
        process.exit(1);
    }

    try {
        const target = uri === atlasUri ? 'Atlas MongoDB' : 'localhost MongoDB';
        logger.info('Attempting MongoDB connection', { target });
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
        logger.info('MongoDB connected', { target: isLocal ? 'Localhost' : 'Atlas', host: conn.connection.host });
    } catch (error) {
        logger.error('MongoDB connection failed', error);

        if (uri === atlasUri && useLocalFallback) {
            try {
                logger.warn('Falling back to localhost MongoDB');
                const localConn = await mongoose.connect(localUri);
                logger.info('MongoDB connected', { target: 'Localhost', host: localConn.connection.host });
            } catch (localError) {
                logger.error('Localhost MongoDB fallback failed', localError);
                process.exit(1);
            }
            return;
        }

        process.exit(1);
    }
};

module.exports = connectDB;

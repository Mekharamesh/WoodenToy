const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const catalogV2Routes = require('./routes/catalogV2Routes');
const staffRoutes = require('./routes/staffRoutes');
const roleRoutes = require('./routes/roleRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const feeRoutes = require('./routes/feeRoutes');
const cancellationRoutes = require('./routes/cancellationRoutes');
const refundRoutes = require('./routes/refundRoutes');
const walletRoutes = require('./routes/walletRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes  = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
// const seedAttributes = require('./seedAttributes');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Module = require('./models/Module');
const StaffModel = require('./models/Staff');
const logger = require('./utils/logger');
const { requestId, securityHeaders, rateLimiter } = require('./middleware/securityMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load env vars from the backend folder explicitly so production hosts
// can still resolve the .env file even when the process starts elsewhere.
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to database
connectDB();

// Seed default attributes once DB is open
// mongoose.connection.once('open', async () => {
//     seedAttributes();
//     try {
//         await Review.collection.dropIndex('product_1_user_1');
//         console.log('Dropped legacy review unique index product_1_user_1');
//     } catch (err) {
//         if (err.codeName !== 'IndexNotFound' && err.code !== 27) {
//             console.warn('Could not drop legacy review index:', err.message);
//         }
//     }

//     try {
//         const duplicates = await Review.aggregate([
//             { $match: { user: { $exists: true }, orderId: { $exists: false } } },
//             { $group: { _id: '$user', count: { $sum: 1 }, docs: { $push: '$_id' } } },
//             { $match: { count: { $gt: 1 } } },
//         ]);

//         for (const dup of duplicates) {
//             const ids = dup.docs.slice(1);
//             if (ids.length > 0) {
//                 await Review.deleteMany({ _id: { $in: ids } });
//             }
//         }
//     } catch (err) {
//         console.warn('Could not clean legacy review duplicates:', err.message);
//     }

//     await Review.syncIndexes();
//     console.log('Connected to DB. Valid order statuses:', Order.VALID_STATUSES.join(', '));
//     try {
//         const count = await Module.countDocuments();
//         if (count === 0) {
//             const initial = (StaffModel.PERMISSION_MODULES || []).map((k, i) => ({
//                 key: k,
//                 label: k.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
//                 icon: '',
//                 isActive: true,
//                 displayOrder: i,
//             }));
//             if (initial.length > 0) {
//                 await Module.insertMany(initial);
//                 console.log('Seeded Module collection with default admin modules');
//             }
//         }
//     } catch (err) {
//         console.warn('Could not seed Module collection:', err.message);
//     }
// });

const app = express();
app.set('trust proxy', true);
    
// Middleware
app.use(requestId);
app.use(securityHeaders);
app.use(rateLimiter());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ✅ CORS — Add your frontend URLs here
const allowedOrigins = [
    'http://localhost:5173',          // Local dev
    'http://localhost:3000',          // Alternative local dev
    'https://darkorange-louse-498272.hostingersite.com',
    'https://linen-finch-820225.hostingersite.com',
    'http://localhost:4173',
    'http://192.168.1.48:4173',
    'http://192.168.1.41:4173',
    'http://10.186.33.1:4173',
    process.env.FRONTEND_URL,        // Production domain (set in .env)
].filter(Boolean); // remove undefined entries

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,   // Allow cookies / Authorization headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve uploaded media before the API no-cache middleware so images/videos can
// be reused by the browser instead of refetched on every product refresh.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    immutable: true,
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/v2/catalog', catalogV2Routes);
app.use('/api/staff', staffRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/cancellation-rules', cancellationRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cms', cmsRoutes);

app.get('/', (req, res) => {
    res.json({ success: true, message: 'API is running...' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info('Server running', { port: PORT });
});

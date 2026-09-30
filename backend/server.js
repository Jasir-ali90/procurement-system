const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

// Register all Mongoose models for population
require('./models/Department');
require('./models/User');
require('./models/Vendor');
require('./models/VendorRating');
require('./models/PurchaseRequest');
require('./models/RFQ');
require('./models/PurchaseOrder');
require('./models/GoodsReceived');
require('./models/Notification');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Endpoints Mount
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/purchase-requests', require('./routes/prRoutes'));
app.use('/api/rfq', require('./routes/rfqRoutes'));
app.use('/api/purchase-orders', require('./routes/poRoutes'));
app.use('/api/grn', require('./routes/grnRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Procurement Engine active on local port ${PORT}`));
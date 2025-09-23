const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const AppError = require('./utils/appError');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const userRoutes = require('./routes/userRoutes');
const donorRoutes = require('./routes/donorRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const cityRoutes = require('./routes/cityRoutes');
const patientRoutes = require('./routes/patientRoutes');
const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');
const distributorRoutes = require('./routes/distributorRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const materialTypeRoutes = require('./routes/materialTypeRoutes');
const materialRoutes = require('./routes/materialRoutes');
const materialLoanRoutes = require('./routes/materialLoanRoutes');
const sackRoutes= require('./routes/sackRoutes');
const moneyTrackRoutes = require('./routes/moneyTrackRoutes');
const supplyRequestRoutes = require('./routes/supplyRequestRoutes');

const app = express();

app.use(cors({
  origin: '*', // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific HTTP methods
  allowedHeaders: 'Content-Type, Authorization' // Allow specific headers
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const buildPath = path.join(__dirname, 'dist');
app.use(express.static(buildPath));

// Handle all other routes by serving the frontend's index.html
app.get('/app', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) {
            res.status(500).send('Error loading the frontend');
        }
    });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/donors', donorRoutes);
app.use('/api/v1/diseases', diseaseRoutes);
app.use('/api/v1/cities', cityRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/distributors', distributorRoutes);
app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/material-types', materialTypeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/material-loans', materialLoanRoutes);
app.use('/api/v1/sacks', sackRoutes);
app.use('/api/v1/finances', moneyTrackRoutes);
app.use('/api/v1/supply-requests', supplyRequestRoutes);


// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;

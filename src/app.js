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

const app = express();

app.use(cors({
  origin: '*', // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific HTTP methods
  allowedHeaders: 'Content-Type, Authorization' // Allow specific headers
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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


// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;

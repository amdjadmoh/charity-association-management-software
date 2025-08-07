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

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true, // allow credentials
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

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;

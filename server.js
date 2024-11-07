const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log('Current environment:', process.env.NODE_ENV);

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// CORS configuration
app.use(cors({
  origin: [
    'https://reco-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:8888'
  ],
  credentials: true
}));

app.use(express.json());

// API routes
const searchRoutes = require('./searchRouter');
app.use('/api/search', searchRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

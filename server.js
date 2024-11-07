const express = require('express');
const cors = require('cors');
const path = require('path');

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log('Current environment:', process.env.NODE_ENV);

const app = express();

// CORS configuration with Railway domains
app.use(cors({
  origin: [
    process.env.RAILWAY_PUBLIC_DOMAIN,
    process.env.RAILWAY_PRIVATE_DOMAIN,
    'https://reco-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:8888'
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.headers.host}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested from:', req.headers.host);
  res.status(200).json({ 
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    domain: req.headers.host,
    railway_domain: process.env.RAILWAY_PUBLIC_DOMAIN
  });
});

// API routes
const searchRoutes = require('./searchRouter');
app.use('/api/search', searchRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle React routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  console.log('Serving React app for path:', req.path);
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Use Railway's PORT environment variable
const PORT = process.env.PORT || 8080;

console.log('Starting server with PORT:', PORT);
console.log('Environment PORT value:', process.env.PORT);

// More robust server startup
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Public domain: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  console.log(`Private domain: ${process.env.RAILWAY_PRIVATE_DOMAIN}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

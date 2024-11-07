const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Default to 'production' if NODE_ENV is not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Log environment for debugging
console.log('Current environment:', process.env.NODE_ENV);

// Only load .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Verify required environment variables are set
const requiredEnvVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'YOUTUBE_API_KEY',
];

// Log all environment variables (be careful with sensitive data)
console.log('Available environment variables:', Object.keys(process.env));

// Check variables but don't exit in production
const missingEnvVars = requiredEnvVars.filter(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`Warning: Missing ${varName}`);
    return true;
  }
  // Log first few characters for verification
  console.log(`Found ${varName}: ${value.substring(0, 4)}...`);
  return false;
});

if (missingEnvVars.length > 0) {
  console.error('Warning: Missing environment variables:', missingEnvVars);
  // Only exit in development
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

// Add this after your environment variable setup
if (process.env.NODE_ENV === 'production') {
  process.env.SPOTIFY_REDIRECT_URI = 'https://reco-production.up.railway.app/callback';
}

const app = express();

app.use(cors({
  origin: [
    'https://reco-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:8888'
  ],
  credentials: true
}));
app.use(express.json());

// Add this before your other routes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Import routes
const searchRoutes = require('./searchRouter');

// Use routes
app.use('/api/search', searchRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

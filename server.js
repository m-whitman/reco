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

// Log environment for debugging
console.log('Current environment:', process.env.NODE_ENV);

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

const app = express();

app.use(cors());
app.use(express.json());

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

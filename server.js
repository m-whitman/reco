const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();
const isDevelopment = process.env.NODE_ENV === 'development';
const PORT = isDevelopment ? 8888 : (process.env.PORT || 8080);

const app = express();

app.use(cors({
  origin: isDevelopment
    ? ['http://localhost:3000', 'http://localhost:8888']
    : [
        process.env.RAILWAY_PUBLIC_DOMAIN,
        process.env.RAILWAY_PRIVATE_DOMAIN,
        'https://reco-production.up.railway.app'
      ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

app.use('/api/search', require('./searchRouter'));

if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`[DEV] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
} else {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

app.use((req, res, next) => {
  console.log(`[${isDevelopment ? 'DEV' : 'PROD'}] ${req.method} ${req.path}`);
  next();
});

app.use((req, res) => {
  console.log(`[404] No route found for ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 ${isDevelopment ? 'Development' : 'Production'} server running at:
${isDevelopment 
  ? `- API: http://localhost:${PORT}/api\n- Frontend: http://localhost:3000`
  : `- Port: ${PORT}\n- Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN}`}
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

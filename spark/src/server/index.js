/**
 * Spark Server Entry Point
 * 
 * Main server file for the Spark web application prototyping tool.
 * Provides API endpoints and WebSocket support for real-time updates.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration - restrict in production
const corsOptions = {
  origin: isProduction ? ['https://yourdomain.com'] : '*',
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Spark',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// API routes (to be implemented)
app.get('/api/projects', (req, res) => {
  res.json({ 
    projects: [],
    message: 'Project management to be implemented'
  });
});

// API 404 handler - must come before catch-all route
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Serve the main application (catch-all for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: isProduction ? 'An error occurred' : err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Spark server running on http://localhost:${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}/api`);
  console.log(`✨ Ready for web app prototyping!`);
  console.log(`🔧 Environment: ${isProduction ? 'production' : 'development'}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  if (isProduction) {
    // In production, log and exit gracefully
    process.exit(1);
  }
});

module.exports = app;

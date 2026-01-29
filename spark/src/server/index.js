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

// Middleware
app.use(cors());
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

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Spark server running on http://localhost:${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}/api`);
  console.log(`✨ Ready for web app prototyping!`);
});

module.exports = app;

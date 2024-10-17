// Import express
const express = require('express');
const { getMapsData } = require('./visitLinkAgain');

// Initialize express
const app = express();

// Define a port
const port = 8000;

// API route to handle GET requests
app.get('/api/:link', (req, res) => {
getMapsData(req.params.link);
  res.json({
    message: 'Welcome to the API!',
    success: true
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

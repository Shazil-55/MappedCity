// Import express
import express from 'express';
import {getMapsData} from './visitLinkAgain.js';

// Initialize express
const app = express();

// Define a port
const port = 8000;
app.get('/', (req, res) => {
    getMapsData();
      res.json({
        message: 'Welcome to the API!',
        success: true
      });
    });
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

//load environment variables from .env file
require('dotenv').config();
//import required modules
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

//create an express application
const app  = express();
//set the port to listen on, default to 5000 if not specified in environment variables
const PORT = process.env.PORT || 5000;

//enable CORS for frontend URL and allow credentials
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
//parse incoming JSON requests
app.use(express.json());

//health check endpoint to verify that the server is running
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'Hello College API' }));
//use the imported routes for all API endpoints under the /api path
app.use('/api', routes);

//handle 404 errors for undefined routes and return a JSON response
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

//start the server and listen on the specified port, logging a message to indicate that the server is running
app.listen(PORT, () => console.log(`Hello College backend on :${PORT}`));
module.exports = app;

const express = require('express');
const ticketsRoutes = require('./routes/tickets.routes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Internal Ticket API'
  });
});

app.use('/tickets', ticketsRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;

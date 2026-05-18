const express = require('express');
const ticketsController = require('../controllers/tickets.controller');

const router = express.Router();

router.get('/', ticketsController.listTickets);
router.post('/', ticketsController.createTicket);
router.patch('/:id/status', ticketsController.updateTicketStatus);

module.exports = router;

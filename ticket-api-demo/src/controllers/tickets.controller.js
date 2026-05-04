const ticketsService = require('../services/tickets.service');
const {
  validateCreateTicket,
  validateUpdateTicketStatus
} = require('../validators/tickets.validator');

function listTickets(req, res, next) {
  try {
    res.status(200).json(ticketsService.listTickets());
  } catch (error) {
    next(error);
  }
}

function createTicket(req, res, next) {
  try {
    validateCreateTicket(req.body);

    const ticket = ticketsService.createTicket(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

function updateTicketStatus(req, res, next) {
  try {
    validateUpdateTicketStatus(req.body);

    const ticket = ticketsService.updateTicketStatus(req.params.id, req.body.status);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTickets,
  createTicket,
  updateTicketStatus
};

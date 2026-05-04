const tickets = [];
let nextId = 1;

function listTickets() {
  return tickets;
}

function createTicket({ title, description, priority }) {
  const ticket = {
    id: String(nextId),
    title,
    description,
    priority,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  nextId += 1;
  tickets.push(ticket);

  return ticket;
}

function updateTicketStatus(id, status) {
  const ticket = tickets.find((item) => item.id === id);

  if (!ticket) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  return ticket;
}

function resetTicketsForTests() {
  tickets.length = 0;
  nextId = 1;
}

module.exports = {
  listTickets,
  createTicket,
  updateTicketStatus,
  resetTicketsForTests
};

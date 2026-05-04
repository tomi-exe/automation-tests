const allowedPriorities = ['low', 'medium', 'high'];
const allowedStatuses = ['open', 'in_progress', 'resolved'];

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateCreateTicket(payload) {
  if (!payload || typeof payload !== 'object') {
    throw createValidationError('Request body is required');
  }

  if (!payload.title) {
    throw createValidationError('title is required');
  }

  if (!payload.description) {
    throw createValidationError('description is required');
  }

  if (!allowedPriorities.includes(payload.priority)) {
    throw createValidationError('priority must be one of: low, medium, high');
  }
}

function validateUpdateTicketStatus(payload) {
  if (!payload || typeof payload !== 'object') {
    throw createValidationError('Request body is required');
  }

  if (!allowedStatuses.includes(payload.status)) {
    throw createValidationError('status must be one of: open, in_progress, resolved');
  }
}

module.exports = {
  validateCreateTicket,
  validateUpdateTicketStatus,
  allowedPriorities,
  allowedStatuses
};

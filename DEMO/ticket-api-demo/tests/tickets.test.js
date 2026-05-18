const request = require('supertest');
const app = require('../src/app');
const ticketsService = require('../src/services/tickets.service');

beforeEach(() => {
  ticketsService.resetTicketsForTests();
});

describe('Internal Ticket API', () => {
  test('GET /health returns service status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'Internal Ticket API'
    });
  });

  test('GET /tickets returns an empty list by default', async () => {
    const response = await request(app).get('/tickets');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST /tickets creates a ticket', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        title: 'VPN issue',
        description: 'User cannot connect to VPN',
        priority: 'high'
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: '1',
      title: 'VPN issue',
      description: 'User cannot connect to VPN',
      priority: 'high',
      status: 'open'
    });
    expect(response.body.createdAt).toBeDefined();
  });

  test('POST /tickets validates required fields', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        priority: 'medium'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('title is required');
  });

  test('POST /tickets validates priority values', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        title: 'Laptop issue',
        description: 'Battery is not charging',
        priority: 'urgent'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('priority must be one of: low, medium, high');
  });

  test('PATCH /tickets/:id/status updates a ticket status', async () => {
    await request(app)
      .post('/tickets')
      .send({
        title: 'Email problem',
        description: 'Mailbox does not sync',
        priority: 'low'
      });

    const response = await request(app)
      .patch('/tickets/1/status')
      .send({
        status: 'in_progress'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: '1',
      status: 'in_progress'
    });
    expect(response.body.updatedAt).toBeDefined();
  });

  test('PATCH /tickets/:id/status validates status values', async () => {
    const response = await request(app)
      .patch('/tickets/1/status')
      .send({
        status: 'closed'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('status must be one of: open, in_progress, resolved');
  });

  test('PATCH /tickets/:id/status returns 404 when ticket does not exist', async () => {
    const response = await request(app)
      .patch('/tickets/99/status')
      .send({
        status: 'resolved'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Ticket not found');
  });
});

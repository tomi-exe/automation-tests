const fs = require('fs');
const path = require('path');

const automationRoot = path.resolve(__dirname, '..');
const outputPath = path.join(automationRoot, 'release-input.json');

const releaseInput = {
  date: new Date().toISOString().slice(0, 10),
  title: 'ticket-api-demo',
  repo: 'TU_WORKSPACE/ticket-api-demo',
  targetRepo: '../ticket-api-demo',
  branch: 'main',
  commit: '9f8e7d6c5b4a3a2b1c0d',
  commits: [
    'a1b2c3d - feat: create base ticket API (Demo User)',
    'b2c3d4e - feat: add ticket validation rules (Demo User)',
    'c3d4e5f - fix: restrict ticket priority values (Demo User)',
    'd4e5f6a - refactor: move ticket logic into service layer (Demo User)',
    'e5f6a7b - test: add ticket endpoint coverage (Demo User)'
  ].join('\n'),
  diffStat: [
    ' src/app.js                              |  34 +++++++++++',
    ' src/controllers/tickets.controller.js   |  43 ++++++++++++++',
    ' src/services/tickets.service.js         |  52 +++++++++++++++++',
    ' src/validators/tickets.validator.js     |  37 ++++++++++++',
    ' tests/tickets.test.js                   | 112 ++++++++++++++++++++++++++++++++++++',
    ' bitbucket-pipelines.yml                 |  18 ++++++',
    ' 6 files changed, 296 insertions(+)'
  ].join('\n'),
  diffSummary: [
    'Adds a Node.js Express API for internal support tickets.',
    'Creates endpoints for healthcheck, ticket listing, ticket creation and status updates.',
    'Adds validation for required fields, allowed priorities and allowed statuses.',
    'Separates routing, controllers, validators and business logic.',
    'Adds Jest and Supertest coverage for the main API flows.'
  ].join('\n')
};

fs.writeFileSync(outputPath, `${JSON.stringify(releaseInput, null, 2)}\n`, 'utf8');
console.log(`Sample release input written to ${outputPath}`);

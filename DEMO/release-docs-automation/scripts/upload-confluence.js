require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const automationRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(automationRoot, 'release-doc.html');
const inputPath = path.join(automationRoot, 'release-input.json');

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required`);
  }
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
}

async function uploadToConfluence() {
  [
    'CONFLUENCE_EMAIL',
    'CONFLUENCE_API_TOKEN',
    'CONFLUENCE_BASE_URL',
    'CONFLUENCE_SPACE_ID',
    'CONFLUENCE_PARENT_PAGE_ID'
  ].forEach(requireEnv);

  requireFile(htmlPath);
  requireFile(inputPath);

  const html = fs.readFileSync(htmlPath, 'utf8');
  const releaseInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const baseUrl = process.env.CONFLUENCE_BASE_URL.replace(/\/$/, '');
  const title = `Release ${releaseInput.date} - ${releaseInput.branch}`;

  const payload = {
    spaceId: process.env.CONFLUENCE_SPACE_ID,
    status: 'current',
    title,
    parentId: process.env.CONFLUENCE_PARENT_PAGE_ID,
    body: {
      representation: 'storage',
      value: html
    }
  };

  const response = await axios.post(`${baseUrl}/api/v2/pages`, payload, {
    auth: {
      username: process.env.CONFLUENCE_EMAIL,
      password: process.env.CONFLUENCE_API_TOKEN
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  console.log(`Confluence page created: ${response.data.id}`);

  if (response.data._links?.webui) {
    console.log(`${baseUrl}${response.data._links.webui}`);
  }
}

uploadToConfluence().catch((error) => {
  console.error(`Failed to upload release documentation: ${error.message}`);

  if (error.response) {
    console.error('Confluence response:');
    console.error(JSON.stringify(error.response.data, null, 2));
  }

  process.exit(1);
});

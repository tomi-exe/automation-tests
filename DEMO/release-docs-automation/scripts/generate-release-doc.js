require('dotenv').config();

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const automationRoot = path.resolve(__dirname, '..');
const inputPath = path.join(automationRoot, 'release-input.json');
const templatePath = path.join(automationRoot, 'templates', 'confluence-release-template.html');
const outputPath = path.join(automationRoot, 'release-doc.html');

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
}

function buildPrompt(releaseInput, template) {
  return `
Genera documentacion de release en HTML compatible con Confluence.
Devuelve solo el HTML final.
No incluyas texto fuera del HTML final.
No uses markdown.
No inventes informacion.
Si no hay suficiente informacion, indicalo explicitamente en la seccion correspondiente.

Debes respetar exactamente la estructura del template.
Debes reemplazar todos los placeholders con contenido HTML simple.
Para {{resumen_tecnico}} y {{cambios_detallados}}, genera solamente elementos <li>...</li>.
Separa claramente:
- resumen funcional
- resumen tecnico
- cambios detallados
- impacto
- riesgos o consideraciones
- referencias

Template obligatorio:
${template}

Datos reales del release:
${JSON.stringify(releaseInput, null, 2)}
`;
}

async function generateReleaseDoc() {
  requireFile(inputPath);
  requireFile(templatePath);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate release documentation');
  }

  const releaseInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const template = fs.readFileSync(templatePath, 'utf8');
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: 'You generate concise, accurate release documentation in simple Confluence-compatible HTML.'
      },
      {
        role: 'user',
        content: buildPrompt(releaseInput, template)
      }
    ]
  });

  const html = response.choices[0]?.message?.content?.trim();

  if (!html) {
    throw new Error('OpenAI returned an empty release document');
  }

  fs.writeFileSync(outputPath, `${html}\n`, 'utf8');
  console.log(`Release document written to ${outputPath}`);
}

generateReleaseDoc().catch((error) => {
  console.error(`Failed to generate release documentation: ${error.message}`);
  process.exit(1);
});

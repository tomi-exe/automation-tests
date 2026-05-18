# ticket-api-demo

API demo para simular un proyecto real de empresa dentro de la POC de documentacion automatizada de releases.

Esta app no contiene scripts de automatizacion reutilizable. Solo expone una API simple de tickets internos, tests y un pipeline que consume el repo central `release-docs-automation`.

## Instalacion

```bash
npm install
```

## Ejecutar API

```bash
npm run dev
```

Por defecto escucha en `http://localhost:3000`.

## Ejecutar tests

```bash
npm test
```

## Endpoints

- `GET /health`: retorna el estado del servicio.
- `GET /tickets`: lista tickets en memoria.
- `POST /tickets`: crea un ticket.
- `PATCH /tickets/:id/status`: actualiza el estado de un ticket.

Ejemplo:

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"VPN issue\",\"description\":\"User cannot connect\",\"priority\":\"high\"}"
```

Reglas:

- `title` y `description` son obligatorios.
- `priority` solo puede ser `low`, `medium` o `high`.
- `status` solo puede ser `open`, `in_progress` o `resolved`.
- No usa base de datos; los tickets viven en memoria.

## Pipeline

El pipeline corre solo en `main`:

1. Instala dependencias de la API con `npm ci`.
2. Ejecuta tests con `npm test`.
3. Clona el repo central `release-docs-automation`.
4. Ejecuta la automatizacion apuntando a este repo mediante `TARGET_REPO="../ticket-api-demo"`.

Fragmento conceptual:

```bash
cd ..
git clone https://x-token-auth:${AUTOMATION_REPO_TOKEN}@bitbucket.org/TU_WORKSPACE/release-docs-automation.git
cd release-docs-automation
npm ci
TARGET_REPO="../ticket-api-demo" npm run release:docs
```

## Variables en Bitbucket

Configurar como variables seguras:

- `AUTOMATION_REPO_TOKEN`: token con permiso de lectura sobre el repo central de automatizacion.
- `OPENAI_API_KEY`: API key de OpenAI usada por el repo central.
- `CONFLUENCE_EMAIL`: email de Confluence.
- `CONFLUENCE_API_TOKEN`: token de Confluence.
- `CONFLUENCE_BASE_URL`: URL base, por ejemplo `https://your-domain.atlassian.net/wiki`.
- `CONFLUENCE_SPACE_ID`: ID del espacio destino.
- `CONFLUENCE_PARENT_PAGE_ID`: pagina padre para releases.

## Commits sugeridos para demo

Crear commits pequenos y expresivos ayuda a que la IA genere una documentacion de release clara:

- `feat: create base ticket API`
- `feat: add ticket validation rules`
- `fix: restrict ticket priority values`
- `refactor: move ticket logic into service layer`
- `test: add ticket endpoint coverage`

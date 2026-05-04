# release-docs-automation

Repo central reutilizable para generar documentacion de releases con Bitbucket Pipelines, OpenAI y Confluence.

Este proyecto no contiene codigo de la app demo. Sus scripts pueden ejecutarse contra cualquier repositorio usando `TARGET_REPO`.

## Flujo

```text
Bitbucket commits/diff
        ↓
collect-changes.js
        ↓
OpenAI
        ↓
release-doc.html
        ↓
Confluence API
        ↓
Pagina de release estructurada
```

## Instalacion

```bash
npm install
cp .env.example .env
```

## Variables requeridas

```env
OPENAI_API_KEY=
CONFLUENCE_EMAIL=
CONFLUENCE_API_TOKEN=
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net/wiki
CONFLUENCE_SPACE_ID=
CONFLUENCE_PARENT_PAGE_ID=
TARGET_REPO=
```

`TARGET_REPO` es opcional. Si no existe, `collect-changes.js` usa `.` como fallback.

## Ejecutar sample

El sample crea un `release-input.json` mock sin depender de git. El script npm `release:sample` tambien intenta generar el HTML, por lo que requiere `OPENAI_API_KEY`.

```bash
npm install
npm run release:sample
```

Si solo quieres generar el input mock:

```bash
node scripts/generate-sample-release.js
```

## Ejecutar contra otro repo

Desde este repo:

```bash
TARGET_REPO="../ticket-api-demo" npm run release:docs
```

Flujo por pasos:

```bash
TARGET_REPO="../ticket-api-demo" npm run release:collect
npm run release:generate-doc
npm run release:publish
```

## Publicar en Confluence

`upload-confluence.js` lee:

- `release-doc.html`
- `release-input.json`

Luego crea una pagina hija usando Confluence Cloud REST API v2:

```text
POST ${CONFLUENCE_BASE_URL}/api/v2/pages
```

Payload:

```json
{
  "spaceId": "...",
  "status": "current",
  "title": "Release YYYY-MM-DD - branch",
  "parentId": "...",
  "body": {
    "representation": "storage",
    "value": "HTML generado"
  }
}
```

No se imprimen tokens. Si Confluence responde con error, el script muestra la respuesta de la API para diagnostico.

## Template

El HTML base esta en:

```text
templates/confluence-release-template.html
```

El prompt exige que OpenAI respete esa estructura y devuelva solo HTML compatible con Confluence, sin markdown.

## Limitaciones

- La calidad del resultado depende de commits y diffs claros.
- `git diff HEAD~1 HEAD` necesita al menos dos commits.
- La publicacion requiere permisos correctos en el espacio y pagina padre de Confluence.
- `release:sample` necesita `OPENAI_API_KEY` porque genera el HTML despues de crear el input mock.
- No valida aun contra un schema formal de Confluence storage.

## Mejoras futuras

- Integracion con Swagger/OpenAPI para enriquecer la documentacion funcional y tecnica.
- Comparar contra tags o releases previos en lugar de solo `HEAD~1`.
- Agregar enlaces a pull requests y commits de Bitbucket.
- Incorporar aprobacion manual antes de publicar.
- Guardar artefactos del pipeline para auditoria.

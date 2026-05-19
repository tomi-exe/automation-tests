# Release Docs Automation POC

## Objetivo

Este proyecto demuestra una POC para automatizar la documentacion de releases usando:

- Bitbucket Pipelines como motor de ejecucion.
- Un repo central en GitHub con scripts reutilizables.
- Groq como proveedor de IA para generar el contenido.
- Confluence Cloud como destino final de la documentacion.

La idea principal es evitar que cada repo de aplicacion tenga sus propios scripts de documentacion. En su lugar, el pipeline del repo de aplicacion clona un repo central de automatizacion, ejecuta los scripts contra el codigo actual y publica una pagina estructurada en Confluence.

## Repos involucrados

### Repo de aplicacion demo

Repo Bitbucket:

```text
https://bitbucket.org/automation-confluence/automation-tests
```

Contiene una app demo llamada `ticket-api-demo`, que simula una API interna de tickets de soporte.

Responsabilidades:

- Codigo fuente de la API.
- Tests automatizados.
- Pipeline de Bitbucket.
- No contiene la logica reutilizable de automatizacion.

### Repo central de automatizacion

Repo GitHub:

```text
https://github.com/tomi-exe/Automation-scripts-bitbucket
```

Contiene los scripts reutilizables:

```text
scripts/
  collect-changes.js
  generate-release-doc.js
  upload-confluence.js
  generate-sample-release.js

templates/
  release-doc-template.md

package.json
package-lock.json
.env.example
.gitignore
README.md
```

Responsabilidades:

- Recolectar informacion de git desde un repo objetivo.
- Generar documentacion Markdown con Groq.
- Publicar una pagina hija en Confluence.
- Poder ejecutarse contra cualquier repo usando `TARGET_REPO`.

## Tecnologias

### Node.js 20

Runtime usado tanto por la app demo como por los scripts de automatizacion.

### Express

Framework HTTP usado por `ticket-api-demo` para exponer la API REST de tickets.

### Jest y Supertest

Herramientas usadas para probar los endpoints de la API demo.

### Bitbucket Pipelines

Ejecuta el flujo CI/CD:

1. Instala dependencias.
2. Ejecuta tests y captura si pasan o fallan.
3. Clona el repo central de automatizacion.
4. Ejecuta la generacion y publicacion de documentacion.

### Groq

Proveedor de IA usado para transformar commits y diffs en documentacion funcional y tecnica.

El modelo configurado para la POC es:

```text
llama-3.1-8b-instant
```

### Confluence Cloud

Destino final de la documentacion de release. El script crea una pagina hija usando Confluence Cloud REST API v2.

## Flujo de alto nivel

```text
Commit en Bitbucket
        ↓
Bitbucket Pipelines
        ↓
npm test en ticket-api-demo
        ↓
RELEASE_STATUS=passed o RELEASE_STATUS=broken
        ↓
git clone del repo central de scripts en GitHub
        ↓
collect-changes.js
        ↓
generate-release-doc.js usando Groq
        ↓
release-doc.md
        ↓
upload-confluence.js
        ↓
Pagina de release en Confluence
```

## Como funciona el pipeline

Archivo:

```text
bitbucket-pipelines.yml
```

Pipeline actual:

```yaml
image: node:20

pipelines:
  branches:
    main:
      - step:
          name: Test and generate release docs
          caches:
            - node
          script:
            - cd ticket-api-demo
            - npm ci
            - set +e
            - npm test > test-output.log 2>&1
            - TEST_EXIT_CODE=$?
            - cat test-output.log
            - if [ "$TEST_EXIT_CODE" -eq 0 ]; then export RELEASE_STATUS="passed"; else export RELEASE_STATUS="broken"; fi
            - set -e
            - cd ..
            - cd ..
            - git clone https://github.com/tomi-exe/Automation-scripts-bitbucket.git
            - cd Automation-scripts-bitbucket
            - npm ci
            - RELEASE_STATUS="$RELEASE_STATUS" TEST_OUTPUT_PATH="$BITBUCKET_CLONE_DIR/ticket-api-demo/test-output.log" TARGET_REPO="$BITBUCKET_CLONE_DIR/ticket-api-demo" npm run release:docs
```

### Paso 1: entrar a la app demo

```bash
cd ticket-api-demo
```

El repo Bitbucket contiene la app dentro de la carpeta `ticket-api-demo`.

### Paso 2: instalar dependencias

```bash
npm ci
```

Instala dependencias exactamente segun `package-lock.json`.

### Paso 3: ejecutar tests y capturar estado

```bash
set +e
npm test > test-output.log 2>&1
TEST_EXIT_CODE=$?
cat test-output.log
if [ "$TEST_EXIT_CODE" -eq 0 ]; then export RELEASE_STATUS="passed"; else export RELEASE_STATUS="broken"; fi
set -e
```

Valida la API demo, pero no detiene el pipeline si hay fallas.
Tambien guarda la salida completa de tests en `test-output.log`.

Si los tests pasan:

```text
RELEASE_STATUS=passed
```

Si los tests fallan:

```text
RELEASE_STATUS=broken
```

Esto permite publicar igualmente una pagina en Confluence indicando que el release esta roto.

### Paso 4: volver al workspace del pipeline

```bash
cd ..
cd ..
```

Esto posiciona el proceso fuera del repo clonado por Bitbucket para poder clonar al lado el repo central de scripts.

### Paso 5: clonar repo central de automatizacion

```bash
git clone https://github.com/tomi-exe/Automation-scripts-bitbucket.git
```

Como el repo de GitHub es publico, no se requiere token para clonarlo.

### Paso 6: instalar dependencias del repo central

```bash
cd Automation-scripts-bitbucket
npm ci
```

Instala Axios, dotenv y OpenAI SDK. El SDK se usa con la API compatible de Groq.

### Paso 7: ejecutar automatizacion contra el repo demo

```bash
RELEASE_STATUS="$RELEASE_STATUS" TARGET_REPO="$BITBUCKET_CLONE_DIR/ticket-api-demo" npm run release:docs
```

`TARGET_REPO` indica a los scripts contra que repo deben ejecutar comandos git.
`RELEASE_STATUS` indica si la suite de tests paso o fallo.
`TEST_OUTPUT_PATH` apunta al log de tests para que Groq pueda explicar el fallo.

`release:docs` ejecuta:

```bash
npm run release:collect
npm run release:generate-doc
npm run release:publish
```

## Scripts del repo central

### collect-changes.js

Responsabilidad:

- Leer `TARGET_REPO`.
- Ejecutar comandos git dentro del repo objetivo.
- Generar `release-input.json`.

Informacion recolectada:

- Fecha actual.
- Repo.
- Branch.
- Commit actual.
- Estado del release (`passed`, `broken` o `unknown`).
- Salida de tests si `TEST_OUTPUT_PATH` existe.
- Ultimos 10 commits.
- Diff estadistico entre `HEAD~1` y `HEAD`.
- Diff resumido de archivos relevantes.

Salida:

```text
release-input.json
```

### generate-release-doc.js

Responsabilidad:

- Leer `release-input.json`.
- Leer `templates/release-doc-template.md`.
- Enviar el contexto a Groq.
- Generar Markdown.
- Prefijar el titulo principal con `[BROKEN]` si `releaseStatus` es `broken`.
- Explicar archivo, test y causa probable del fallo si existe salida de tests.

Salida:

```text
release-doc.md
```

El prompt obliga a:

- No usar HTML.
- No inventar informacion.
- Separar resumen funcional y resumen tecnico.
- Explicar cambios detallados.
- Indicar impacto.
- Indicar riesgos o consideraciones.
- Mantener estructura Markdown del template.

### upload-confluence.js

Responsabilidad:

- Leer `release-doc.md`.
- Leer `release-input.json`.
- Convertir Markdown a HTML y crear una pagina hija en Confluence.

Usa Confluence Cloud REST API v2:

```text
POST /api/v2/pages
```

Tambien resuelve `CONFLUENCE_SPACE_ID` cuando se entrega como key, por ejemplo:

```text
DDS
```

Si ya existe una pagina con el mismo titulo, reintenta agregando el commit corto al titulo.

Ejemplo:

```text
Release 2026-05-05 - main - 8441149
```

Si `releaseStatus` es `broken`, el titulo de la pagina se prefija con:

```text
[BROKEN]
```

Ejemplo:

```text
[BROKEN] Release 2026-05-05 - main - e60adbb
```

### generate-sample-release.js

Responsabilidad:

- Generar un `release-input.json` mock.
- Permitir probar el flujo local sin depender de git.

## Template Markdown

Archivo:

```text
templates/release-doc-template.md
```

Estructura:

```md
# Release {{fecha}} - {{titulo}}

## Resumen funcional
{{resumen_funcional}}

## Resumen técnico
{{resumen_tecnico}}

## Cambios detallados
{{cambios_detallados}}

## Impacto
{{impacto}}

## Riesgos o consideraciones
{{riesgos}}

## Referencias
- **Repositorio:** {{repo}}
- **Branch:** {{branch}}
- **Commit:** {{commit}}
- **Fecha:** {{fecha}}
```

## Variables de Bitbucket

Configurar en:

```text
Repository settings → Pipelines → Repository variables
```

Variables requeridas:

```text
GROQ_API_KEY
AI_MODEL
CONFLUENCE_EMAIL
CONFLUENCE_API_TOKEN
CONFLUENCE_BASE_URL
CONFLUENCE_SPACE_ID
CONFLUENCE_PARENT_PAGE_ID
```

Valores usados en la POC:

```text
AI_MODEL=llama-3.1-8b-instant
CONFLUENCE_BASE_URL=https://tomiproyectos.atlassian.net/wiki
CONFLUENCE_SPACE_ID=DDS
CONFLUENCE_PARENT_PAGE_ID=360449
```

Marcar como secured:

```text
GROQ_API_KEY
CONFLUENCE_API_TOKEN
```

Tambien puedes marcar como secured:

```text
CONFLUENCE_EMAIL
```

## Como probar localmente

Desde el repo central de scripts:

```powershell
cd C:\Users\1toma\OneDrive\Escritorio\AUTOMATION\scripts
```

Configurar `.env` local con:

```env
AI_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=
CONFLUENCE_EMAIL=
CONFLUENCE_API_TOKEN=
CONFLUENCE_BASE_URL=https://tomiproyectos.atlassian.net/wiki
CONFLUENCE_SPACE_ID=DDS
CONFLUENCE_PARENT_PAGE_ID=360449
TARGET_REPO=
```

Probar con sample:

```powershell
npm run release:sample
```

Probar contra la app demo:

```powershell
$env:TARGET_REPO="C:\Users\1toma\OneDrive\Escritorio\AUTOMATION\bitbucket-automation-tests-inspect\ticket-api-demo"
npm run release:docs
Remove-Item Env:\TARGET_REPO
```

Probar un release roto localmente:

```powershell
$env:TARGET_REPO="C:\Users\1toma\OneDrive\Escritorio\AUTOMATION\bitbucket-automation-tests-inspect\ticket-api-demo"
$env:RELEASE_STATUS="broken"
npm run release:docs
Remove-Item Env:\TARGET_REPO
Remove-Item Env:\RELEASE_STATUS
```

## Como probar desde Bitbucket

1. Configurar variables del pipeline.
2. Ir a Bitbucket Pipelines.
3. Ejecutar pipeline manualmente en branch `main`.

Tambien puedes dispararlo con un commit:

```bash
git commit --allow-empty -m "chore: trigger release docs pipeline"
git push origin main
```

## Resultado esperado

Si todo funciona y los tests pasan, el pipeline debe:

1. Marcar `RELEASE_STATUS=passed`.
2. Clonar `Automation-scripts-bitbucket`.
3. Generar `release-input.json`.
4. Generar `release-doc.md` usando Groq.
5. Crear una pagina en Confluence.

Salida esperada:

```text
release-input.json generado
release-doc.md generado
Proveedor AI usado: groq
Modelo AI usado: llama-3.1-8b-instant
Pagina creada en Confluence.
```

Si los tests fallan, el pipeline debe:

1. Marcar `RELEASE_STATUS=broken`.
2. Clonar `Automation-scripts-bitbucket`.
3. Generar `release-input.json`.
4. Generar `release-doc.md` usando Groq.
5. Crear una pagina en Confluence con titulo `[BROKEN]`.
6. Prefijar el titulo principal del Markdown con `[BROKEN]`.
7. Convertir el Markdown a HTML para publicarlo en Confluence.
8. Documentar que test fallo, en que archivo y por que.

Salida esperada para un release roto:

```text
Estado del release: broken
Salida de tests leida desde test-output.log
El titulo ya existia. Reintentando como: [BROKEN] Release ...
Pagina creada en Confluence.
```

## Demo de release roto

Para demostrar el flujo de release roto se agrego metadata al endpoint `GET /health` sin actualizar el test.

Cambio funcional:

```js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Internal Ticket API',
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});
```

El test existente espera una respuesta exacta con solo:

```js
{
  status: 'ok',
  service: 'Internal Ticket API'
}
```

Por eso la suite falla, pero el pipeline continua y publica la documentacion como release roto.
La salida de Jest se guarda en `test-output.log`, se pasa al repo central con `TEST_OUTPUT_PATH` y Groq la usa para describir el fallo especifico.

## Limitaciones de la POC

- El historial de git debe tener commits claros para que la IA genere buena documentacion.
- `git diff HEAD~1 HEAD` requiere al menos dos commits.
- La pagina se crea en Confluence; no actualiza paginas existentes.
- Si existe un titulo duplicado, agrega el commit corto al titulo.
- La API demo usa memoria, no base de datos real.

## Mejoras futuras

- Integrar Swagger/OpenAPI como contexto adicional.
- Usar comparacion entre tags o releases.
- Incluir enlaces directos a commits y pull requests.
- Agregar aprobacion manual antes de publicar.
- Crear un indice de releases en Confluence.

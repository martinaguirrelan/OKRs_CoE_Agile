# OKRs · Centro de Excelencia Ágil

Aplicación en **Google Apps Script** para gestionar los OKRs de un Centro de Excelencia (CoE) Ágil. Los datos viven en **Google Sheets** y la interfaz es una **Web App** (HtmlService) con cuatro módulos: Dashboard, Registrar OKRs, Check-ins y Reportes.

## Funcionalidades

- **Multi-gerencia** — Cada Objetivo pertenece a una **Gerencia**. Un catálogo de gerencias administrable y un selector global en la cabecera permiten **filtrar toda la app** (dashboard, mapa, iniciativas, check-ins y reportes) para ver solo la información de una gerencia. Facilita escalar la herramienta a varias áreas.
- **Registrar OKRs** — Alta y edición de Objetivos y Key Results (gerencia, dueño, trimestre, baseline, meta, valor actual).
- **Iniciativas** — Iniciativas ágiles (épicas/proyectos) que contribuyen a cada KR, con estado (pendiente / en progreso / bloqueada / hecha), sprint y **Agilista** asignado. Incluye un catálogo de Agilistas administrable desde la propia interfaz.
- **Dashboard** — Árbol de objetivos con progreso por KR y objetivo, iniciativas anidadas bajo cada KR, semáforo de estado (on-track / en riesgo / fuera de ruta) y tarjetas de resumen. Filtro por trimestre.
- **Check-ins** — Actualizaciones periódicas de avance; cada check-in recalcula el progreso del KR y guarda historial con nivel de confianza y comentario.
- **Reportes** — Genera una hoja "Reporte {trimestre}" dentro del Spreadsheet (objetivos, KRs e iniciativas), lista para revisar o exportar a PDF.

## Modelo de datos (hojas)

| Hoja | Campos |
|------|--------|
| `Objetivos` | id, titulo, dueno, trimestre, estado, descripcion, creadoEn, gerenciaId |
| `Gerencias` | id, nombre |
| `KeyResults` | id, objetivoId, descripcion, dueno, unidad, baseline, meta, actual, progreso, estado |
| `Checkins` | id, krId, fecha, valor, progreso, confianza, comentario, autor |
| `Iniciativas` | id, krId, titulo, scrumMasterId, estado, sprint, descripcion, creadoEn |
| `Agilistas` | id, nombre, equipo |

El progreso de un KR se calcula como `(actual - baseline) / (meta - baseline)` acotado a 0–100 %. El progreso de un objetivo es el promedio de sus KRs. Estados: `>=70` on-track, `40–69` en riesgo, `<40` fuera de ruta.

## Estructura del proyecto

```
appsscript.json     Manifiesto (scopes, runtime V8, web app)
Code.gs             doGet, menú onOpen, include()
Database.gs         Capa de acceso a Sheets (CRUD genérico + esquema)
Okr.gs              Lógica de Objetivos y Key Results
Gerencias.gs        Catálogo de Gerencias (multi-área)
Iniciativas.gs      Iniciativas ágiles ligadas a cada KR
ScrumMasters.gs     Catálogo de Agilistas
Checkins.gs         Registro de check-ins y recálculo de progreso
Reports.gs          Agregaciones del dashboard y reporte por trimestre
Index.html          Estructura de la interfaz (pestañas)
Stylesheet.html     Estilos
JavaScript.html     Lógica de cliente (google.script.run)
```

## Despliegue

### Opción A — Editor de Apps Script (rápido)
1. Crea un Google Sheets nuevo → **Extensiones → Apps Script**.
2. Copia el contenido de cada archivo `.gs` y `.html` a un archivo del mismo nombre en el editor (los `.html` como archivos HTML).
3. Pega `appsscript.json` en el manifiesto (activa "Mostrar archivo de manifiesto" en Configuración del proyecto).
4. Ejecuta la función `setupSpreadsheet` una vez para crear las hojas.
5. **Implementar → Nueva implementación → Aplicación web**.

### Opción B — clasp (desde este repo)
```bash
npm install -g @google/clasp
clasp login
# Crear el proyecto ligado a una hoja nueva:
clasp create --type sheets --title "OKRs CoE Agile" --rootDir .
clasp push
clasp deploy
```
`.clasp.json` queda ignorado por git (contiene tu scriptId).

## Uso

- Desde el Spreadsheet: menú **OKRs CoE → Abrir panel** (sidebar) o **Inicializar hojas**.
- Como Web App: abre la URL de la implementación.

/**
 * Code.gs
 * Punto de entrada: menú del Spreadsheet y publicación de la Web App.
 */

/** Menú personalizado al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('OKRs CoE')
    .addItem('Inicializar hojas', 'setupSpreadsheet')
    .addItem('Abrir panel (sidebar)', 'abrirSidebar')
    .addSeparator()
    .addItem('Asignar "CoE Ágil" a objetivos sin gerencia', 'menuAsignarCoE')
    .addToUi();
}

/** Acción de menú: asigna la gerencia "CoE Ágil" a los objetivos sin gerencia. */
function menuAsignarCoE() {
  const res = asignarGerenciaAObjetivosSinGerencia('CoE Ágil');
  SpreadsheetApp.getUi().alert(
    'Gerencia "' + res.gerencia.nombre + '" asignada a ' + res.asignados +
    ' objetivo(s) que estaban sin gerencia.');
}

/** Abre la interfaz dentro del propio Spreadsheet como sidebar. */
function abrirSidebar() {
  const html = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('OKRs · CoE Ágil');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Publicación como Web App independiente. */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('OKRs · CoE Ágil')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Permite incluir parciales HTML (CSS/JS) desde Index.html. */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

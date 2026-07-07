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
    .addItem('Cargar OKRs de ejemplo (CoE Ágil)', 'menuSembrarOKRs')
    .addToUi();
}

/** Acción de menú: asigna la gerencia "CoE Ágil" a los objetivos sin gerencia. */
function menuAsignarCoE() {
  const res = asignarGerenciaAObjetivosSinGerencia('CoE Ágil');
  SpreadsheetApp.getUi().alert(
    'Gerencia "' + res.gerencia.nombre + '" asignada a ' + res.asignados +
    ' objetivo(s) que estaban sin gerencia.');
}

/** Acción de menú: carga los OKRs de ejemplo (con confirmación). */
function menuSembrarOKRs() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    'Cargar OKRs de ejemplo',
    'Se crearán los objetivos, Key Results e iniciativas de ejemplo en la gerencia ' +
    '"CoE Ágil" (' + trimestreActual_() + '). Los objetivos que ya existan por título se omiten.\n\n¿Continuar?',
    ui.ButtonSet.OK_CANCEL);
  if (resp !== ui.Button.OK) return;

  const r = sembrarOKRsEjemplo();
  ui.alert('Carga completada',
    'Objetivos creados: ' + r.objetivos +
    '\nKey Results: ' + r.keyResults +
    '\nIniciativas: ' + r.iniciativas +
    '\nOmitidos (ya existían): ' + r.omitidos +
    '\nGerencia: ' + r.gerencia + ' · Trimestre: ' + r.trimestre,
    ui.ButtonSet.OK);
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

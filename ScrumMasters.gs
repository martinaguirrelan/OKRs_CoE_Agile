/**
 * ScrumMasters.gs
 * Catálogo de Scrum Masters del CoE. Se asignan a las iniciativas.
 */

function listScrumMasters() {
  return readAll_(SHEETS.SCRUM_MASTERS).sort(function (a, b) {
    return String(a.nombre).localeCompare(String(b.nombre));
  });
}

function saveScrumMaster(data) {
  assertPuedeEscribir_();
  const sm = {
    id: data.id || newId_('sm'),
    nombre: (data.nombre || '').trim(),
    equipo: (data.equipo || '').trim()
  };
  if (!sm.nombre) throw new Error('El Agilista necesita un nombre.');
  return upsert_(SHEETS.SCRUM_MASTERS, sm);
}

/**
 * Elimina un Scrum Master. Las iniciativas que lo tuvieran asignado
 * quedan sin asignar (scrumMasterId vacío) para no perder datos.
 */
function deleteScrumMaster(id) {
  assertPuedeEscribir_();
  const iniciativas = readAll_(SHEETS.INICIATIVAS).filter(function (i) {
    return String(i.scrumMasterId) === String(id);
  });
  iniciativas.forEach(function (i) {
    i.scrumMasterId = '';
    upsert_(SHEETS.INICIATIVAS, i);
  });
  return remove_(SHEETS.SCRUM_MASTERS, id);
}

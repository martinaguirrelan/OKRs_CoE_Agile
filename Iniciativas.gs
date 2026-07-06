/**
 * Iniciativas.gs
 * Iniciativas ágiles (proyectos/épicas) que contribuyen a un Key Result.
 * Cada iniciativa se asigna a un Scrum Master del catálogo.
 */

const ESTADOS_INICIATIVA = ['pendiente', 'en-progreso', 'bloqueada', 'hecha'];

function listIniciativas() {
  return readAll_(SHEETS.INICIATIVAS);
}

function listIniciativasByKR(krId) {
  return listIniciativas().filter(function (i) { return String(i.krId) === String(krId); });
}

function saveIniciativa(data) {
  if (!data.krId) throw new Error('La iniciativa debe pertenecer a un Key Result.');
  if (!(data.titulo || '').trim()) throw new Error('La iniciativa necesita un título.');
  const estado = ESTADOS_INICIATIVA.indexOf(data.estado) !== -1 ? data.estado : 'pendiente';
  const ini = {
    id: data.id || newId_('ini'),
    krId: data.krId,
    titulo: (data.titulo || '').trim(),
    scrumMasterId: data.scrumMasterId || '',
    estado: estado,
    sprint: (data.sprint || '').trim(),
    descripcion: (data.descripcion || '').trim(),
    creadoEn: data.creadoEn || new Date().toISOString()
  };
  return upsert_(SHEETS.INICIATIVAS, ini);
}

function deleteIniciativa(id) {
  return remove_(SHEETS.INICIATIVAS, id);
}

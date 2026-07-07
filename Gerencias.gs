/**
 * Gerencias.gs
 * Catálogo de Gerencias. Cada Objetivo pertenece a una Gerencia, lo que
 * permite escalar la app a varias áreas y filtrar la información por gerencia.
 */

function listGerencias() {
  return readAll_(SHEETS.GERENCIAS).sort(function (a, b) {
    return String(a.nombre).localeCompare(String(b.nombre));
  });
}

function saveGerencia(data) {
  const g = {
    id: data.id || newId_('ger'),
    nombre: (data.nombre || '').trim()
  };
  if (!g.nombre) throw new Error('La gerencia necesita un nombre.');
  return upsert_(SHEETS.GERENCIAS, g);
}

/**
 * Asigna una gerencia (creándola si no existe) a todos los objetivos que aún
 * no tienen gerencia. Idempotente: no toca los que ya tienen una asignada.
 * Devuelve la gerencia y cuántos objetivos se actualizaron.
 */
function asignarGerenciaAObjetivosSinGerencia(nombreGerencia) {
  setupSpreadsheet();
  const existentes = listGerencias().filter(function (g) { return g.nombre === nombreGerencia; });
  const ger = existentes.length ? existentes[0] : saveGerencia({ nombre: nombreGerencia });
  const objetivos = readAll_(SHEETS.OBJETIVOS);
  let asignados = 0;
  objetivos.forEach(function (o) {
    if (!o.gerenciaId) {
      o.gerenciaId = ger.id;
      upsert_(SHEETS.OBJETIVOS, o);
      asignados++;
    }
  });
  return { gerencia: ger, asignados: asignados };
}

/**
 * Elimina una gerencia. Los objetivos que la tuvieran asignada quedan sin
 * gerencia (gerenciaId vacío) para no perder datos.
 */
function deleteGerencia(id) {
  const objetivos = readAll_(SHEETS.OBJETIVOS).filter(function (o) {
    return String(o.gerenciaId) === String(id);
  });
  objetivos.forEach(function (o) {
    o.gerenciaId = '';
    upsert_(SHEETS.OBJETIVOS, o);
  });
  return remove_(SHEETS.GERENCIAS, id);
}

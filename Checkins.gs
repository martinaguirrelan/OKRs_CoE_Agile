/**
 * Checkins.gs
 * Actualizaciones periódicas de avance sobre un Key Result.
 * Cada check-in registra el valor actual del KR y recalcula su progreso.
 */

function listCheckins() {
  return readAll_(SHEETS.CHECKINS).sort(function (a, b) {
    return String(b.fecha).localeCompare(String(a.fecha));
  });
}

function listCheckinsByKR(krId) {
  return listCheckins().filter(function (c) { return String(c.krId) === String(krId); });
}

/**
 * Registra un check-in y actualiza el KR asociado con el nuevo valor actual.
 * data: { krId, valor, confianza, comentario, autor, fecha? }
 */
function addCheckin(data) {
  if (!data.krId) throw new Error('El check-in debe referirse a un Key Result.');
  const kr = readAll_(SHEETS.KEY_RESULTS).filter(function (k) {
    return String(k.id) === String(data.krId);
  })[0];
  if (!kr) throw new Error('No se encontró el Key Result indicado.');

  const valor = Number(data.valor);
  if (isNaN(valor)) throw new Error('El check-in necesita un valor numérico.');

  const progreso = calcularProgresoKR_(kr.baseline, kr.meta, valor);
  const checkin = {
    id: newId_('chk'),
    krId: data.krId,
    fecha: data.fecha || new Date().toISOString().slice(0, 10),
    valor: valor,
    progreso: progreso,
    confianza: data.confianza || 'media', // alta | media | baja
    comentario: (data.comentario || '').trim(),
    autor: (data.autor || '').trim()
  };
  insert_(SHEETS.CHECKINS, checkin);

  // Actualizar el KR con el último valor reportado.
  kr.actual = valor;
  kr.progreso = progreso;
  kr.estado = estadoPorProgreso_(progreso);
  upsert_(SHEETS.KEY_RESULTS, kr);

  return { checkin: checkin, kr: kr };
}

function deleteCheckin(id) {
  return remove_(SHEETS.CHECKINS, id);
}

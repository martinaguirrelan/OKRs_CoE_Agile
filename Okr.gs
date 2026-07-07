/**
 * Okr.gs
 * Lógica de negocio de Objetivos y Key Results.
 * Estados posibles de un KR/Objetivo según su progreso:
 *   >= 70  -> 'on-track'
 *   40..69 -> 'at-risk'
 *   < 40   -> 'off-track'
 */

const ESTADOS = { ON_TRACK: 'on-track', AT_RISK: 'at-risk', OFF_TRACK: 'off-track' };

function estadoPorProgreso_(progreso) {
  if (progreso >= 70) return ESTADOS.ON_TRACK;
  if (progreso >= 40) return ESTADOS.AT_RISK;
  return ESTADOS.OFF_TRACK;
}

/** Progreso de un KR en % (0-100) a partir de baseline/meta/actual. */
function calcularProgresoKR_(baseline, meta, actual) {
  baseline = Number(baseline) || 0;
  meta = Number(meta);
  actual = Number(actual) || 0;
  if (isNaN(meta) || meta === baseline) return 0;
  const pct = ((actual - baseline) / (meta - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// ---------- Objetivos ----------

function listObjetivos() {
  return readAll_(SHEETS.OBJETIVOS);
}

function saveObjetivo(data) {
  const obj = {
    id: data.id || newId_('obj'),
    titulo: (data.titulo || '').trim(),
    dueno: (data.dueno || '').trim(),
    trimestre: (data.trimestre || '').trim(),
    estado: data.estado || 'activo',
    descripcion: (data.descripcion || '').trim(),
    creadoEn: data.creadoEn || new Date().toISOString(),
    gerenciaId: data.gerenciaId || ''
  };
  if (!obj.titulo) throw new Error('El objetivo necesita un título.');
  if (!obj.trimestre) throw new Error('El objetivo necesita un trimestre (ej. 2026-Q3).');
  return upsert_(SHEETS.OBJETIVOS, obj);
}

/** Elimina un objetivo y todos sus KRs (y check-ins asociados). */
function deleteObjetivo(id) {
  const krs = readAll_(SHEETS.KEY_RESULTS).filter(function (kr) {
    return String(kr.objetivoId) === String(id);
  });
  krs.forEach(function (kr) { deleteKeyResult(kr.id); });
  return remove_(SHEETS.OBJETIVOS, id);
}

// ---------- Key Results ----------

function listKeyResults() {
  return readAll_(SHEETS.KEY_RESULTS);
}

function saveKeyResult(data) {
  const baseline = Number(data.baseline) || 0;
  const meta = Number(data.meta);
  const actual = data.actual === '' || data.actual === undefined ? baseline : Number(data.actual);
  if (!data.objetivoId) throw new Error('El Key Result debe pertenecer a un objetivo.');
  if (!(data.descripcion || '').trim()) throw new Error('El Key Result necesita una descripción.');
  if (isNaN(meta)) throw new Error('El Key Result necesita una meta numérica.');

  const progreso = calcularProgresoKR_(baseline, meta, actual);
  const kr = {
    id: data.id || newId_('kr'),
    objetivoId: data.objetivoId,
    descripcion: (data.descripcion || '').trim(),
    dueno: (data.dueno || '').trim(),
    unidad: (data.unidad || '').trim(),
    baseline: baseline,
    meta: meta,
    actual: actual,
    progreso: progreso,
    estado: estadoPorProgreso_(progreso)
  };
  return upsert_(SHEETS.KEY_RESULTS, kr);
}

/** Elimina un KR, sus check-ins y sus iniciativas. */
function deleteKeyResult(id) {
  const checkins = readAll_(SHEETS.CHECKINS).filter(function (c) {
    return String(c.krId) === String(id);
  });
  checkins.forEach(function (c) { remove_(SHEETS.CHECKINS, c.id); });
  const iniciativas = readAll_(SHEETS.INICIATIVAS).filter(function (i) {
    return String(i.krId) === String(id);
  });
  iniciativas.forEach(function (i) { remove_(SHEETS.INICIATIVAS, i.id); });
  return remove_(SHEETS.KEY_RESULTS, id);
}

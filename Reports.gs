/**
 * Reports.gs
 * Agregaciones para el dashboard y generación de reportes por trimestre.
 */

/**
 * Arma el árbol OKR (objetivos con sus KRs) y calcula el progreso del objetivo
 * como promedio del progreso de sus Key Results.
 */
function buildOkrTree_(trimestre) {
  const objetivos = listObjetivos().filter(function (o) {
    return !trimestre || String(o.trimestre) === String(trimestre);
  });
  const krs = listKeyResults();
  const iniciativas = listIniciativas();
  const scrumMasters = listScrumMasters();
  const smById = {};
  scrumMasters.forEach(function (sm) { smById[sm.id] = sm.nombre; });

  return objetivos.map(function (o) {
    const hijos = krs.filter(function (kr) {
      return String(kr.objetivoId) === String(o.id);
    }).map(function (kr) {
      const inis = iniciativas.filter(function (i) {
        return String(i.krId) === String(kr.id);
      }).map(function (i) {
        return Object.assign({}, i, { scrumMasterNombre: smById[i.scrumMasterId] || '' });
      });
      return Object.assign({}, kr, { iniciativas: inis });
    });
    const progreso = hijos.length
      ? Math.round(hijos.reduce(function (s, kr) { return s + (Number(kr.progreso) || 0); }, 0) / hijos.length)
      : 0;
    return {
      objetivo: o,
      keyResults: hijos,
      progreso: progreso,
      estado: estadoPorProgreso_(progreso)
    };
  });
}

/** Datos que consume la Web App al cargar, filtrados según el rol del usuario. */
function getBootstrapData() {
  setupSpreadsheet();
  const usuario = getUsuarioActual_();
  const esAdmin = usuario.rol === ROLES.ADMIN;
  const sinAcceso = usuario.rol === ROLES.SIN_ACCESO;

  // ¿Es visible un objetivo para este usuario? (admin=todo, sin-acceso=nada,
  // resto=solo su gerencia).
  function objVisible(o) {
    if (esAdmin) return true;
    if (sinAcceso) return false;
    return !!usuario.gerenciaId && String(o.gerenciaId) === String(usuario.gerenciaId);
  }

  const objetivos = listObjetivos().filter(objVisible);
  const objIds = {}; objetivos.forEach(function (o) { objIds[o.id] = true; });
  const keyResults = listKeyResults().filter(function (k) { return objIds[k.objetivoId]; });
  const krIds = {}; keyResults.forEach(function (k) { krIds[k.id] = true; });
  const iniciativas = listIniciativas().filter(function (i) { return krIds[i.krId]; });
  const checkins = listCheckins().filter(function (c) { return krIds[c.krId]; });
  const tree = buildOkrTree_(null).filter(function (n) { return objVisible(n.objetivo); });
  const trimestres = uniqueSorted_(objetivos.map(function (o) { return o.trimestre; }));

  // Catálogos: admin ve todas las gerencias; el resto solo la suya.
  const gerencias = esAdmin ? listGerencias() : listGerencias().filter(function (g) {
    return String(g.id) === String(usuario.gerenciaId);
  });

  return {
    tree: tree,
    objetivos: objetivos,
    keyResults: keyResults,
    checkins: checkins,
    iniciativas: iniciativas,
    scrumMasters: listScrumMasters(),
    gerencias: gerencias,
    trimestres: trimestres,
    resumen: resumen_(tree),
    usuario: usuario,
    usuarios: esAdmin ? listUsuarios() : [],
    identidad: detectarIdentidad_(),
    generadoEn: new Date().toISOString()
  };
}

/**
 * Detecta el email del usuario que accede. Con propietario en otro dominio
 * (gmail) y usuarios de Workspace, getActiveUser() suele venir vacío: eso
 * confirma que hace falta alojar el proyecto bajo el dominio corporativo
 * para aplicar permisos reales por gerencia.
 */
function detectarIdentidad_() {
  let activo = '', efectivo = '';
  try { activo = Session.getActiveUser().getEmail() || ''; } catch (e) {}
  try { efectivo = Session.getEffectiveUser().getEmail() || ''; } catch (e) {}
  return { activeEmail: activo, effectiveEmail: efectivo };
}

function resumen_(tree) {
  const totalObj = tree.length;
  let totalKR = 0, onTrack = 0, atRisk = 0, offTrack = 0, sumProg = 0, totalIni = 0, iniHechas = 0;
  tree.forEach(function (n) {
    totalKR += n.keyResults.length;
    n.keyResults.forEach(function (kr) {
      sumProg += Number(kr.progreso) || 0;
      if (kr.estado === ESTADOS.ON_TRACK) onTrack++;
      else if (kr.estado === ESTADOS.AT_RISK) atRisk++;
      else offTrack++;
      (kr.iniciativas || []).forEach(function (i) {
        totalIni++;
        if (i.estado === 'hecha') iniHechas++;
      });
    });
  });
  return {
    objetivos: totalObj,
    keyResults: totalKR,
    iniciativas: totalIni,
    iniciativasHechas: iniHechas,
    onTrack: onTrack,
    atRisk: atRisk,
    offTrack: offTrack,
    progresoPromedio: totalKR ? Math.round(sumProg / totalKR) : 0
  };
}

function uniqueSorted_(arr) {
  const seen = {};
  arr.forEach(function (v) { if (v) seen[v] = true; });
  return Object.keys(seen).sort();
}

/**
 * Genera un reporte del trimestre en una hoja nueva "Reporte {trimestre}" y
 * devuelve la URL directa a esa hoja para abrirla/exportarla.
 */
function generarReporteTrimestre(trimestre, gerenciaId) {
  if (!trimestre) throw new Error('Indica un trimestre para el reporte.');
  // Los no-admin solo pueden reportar su propia gerencia (evita fuga de datos).
  const usuario = getUsuarioActual_();
  if (usuario.rol === ROLES.SIN_ACCESO) throw new Error('No tienes acceso.');
  if (usuario.rol !== ROLES.ADMIN) gerenciaId = usuario.gerenciaId;
  let tree = buildOkrTree_(trimestre);
  let sufijoGerencia = '';
  if (gerenciaId) {
    tree = tree.filter(function (n) { return String(n.objetivo.gerenciaId) === String(gerenciaId); });
    const ger = listGerencias().filter(function (g) { return String(g.id) === String(gerenciaId); })[0];
    if (ger) sufijoGerencia = ' - ' + ger.nombre;
  }
  const ss = getSpreadsheet_();
  const nombre = ('Reporte ' + trimestre + sufijoGerencia).slice(0, 90);
  let sheet = ss.getSheetByName(nombre);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(nombre);

  const filas = [['Tipo', 'Objetivo / Key Result / Iniciativa', 'Dueño / Agilista', 'Progreso %', 'Estado', 'Meta', 'Actual', 'Medición / Fórmula']];
  tree.forEach(function (n) {
    filas.push(['Objetivo', n.objetivo.titulo, n.objetivo.dueno, n.progreso, n.estado, '', '', '']);
    n.keyResults.forEach(function (kr) {
      filas.push(['  KR', kr.descripcion, kr.dueno, kr.progreso, kr.estado, kr.meta, kr.actual, kr.medicion || '']);
      (kr.iniciativas || []).forEach(function (i) {
        filas.push(['    Iniciativa', i.titulo, i.scrumMasterNombre || '', '', i.estado, i.sprint || '', '', '']);
      });
    });
  });
  if (filas.length === 1) filas.push(['—', 'Sin objetivos en este trimestre', '', '', '', '', '', '']);

  sheet.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
  sheet.getRange(1, 1, 1, filas[0].length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, filas[0].length);

  return {
    nombre: nombre,
    url: ss.getUrl() + '#gid=' + sheet.getSheetId(),
    filas: filas.length - 1
  };
}

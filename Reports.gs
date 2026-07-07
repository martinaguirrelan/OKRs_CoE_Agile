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

/** Datos que consume la Web App al cargar. */
function getBootstrapData() {
  setupSpreadsheet();
  const tree = buildOkrTree_(null);
  const trimestres = uniqueSorted_(listObjetivos().map(function (o) { return o.trimestre; }));
  return {
    tree: tree,
    objetivos: listObjetivos(),
    keyResults: listKeyResults(),
    checkins: listCheckins(),
    iniciativas: listIniciativas(),
    scrumMasters: listScrumMasters(),
    trimestres: trimestres,
    resumen: resumen_(tree),
    generadoEn: new Date().toISOString()
  };
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
function generarReporteTrimestre(trimestre) {
  if (!trimestre) throw new Error('Indica un trimestre para el reporte.');
  const tree = buildOkrTree_(trimestre);
  const ss = getSpreadsheet_();
  const nombre = 'Reporte ' + trimestre;
  let sheet = ss.getSheetByName(nombre);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(nombre);

  const filas = [['Tipo', 'Objetivo / Key Result / Iniciativa', 'Dueño / Agilista', 'Progreso %', 'Estado', 'Meta', 'Actual']];
  tree.forEach(function (n) {
    filas.push(['Objetivo', n.objetivo.titulo, n.objetivo.dueno, n.progreso, n.estado, '', '']);
    n.keyResults.forEach(function (kr) {
      filas.push(['  KR', kr.descripcion, kr.dueno, kr.progreso, kr.estado, kr.meta, kr.actual]);
      (kr.iniciativas || []).forEach(function (i) {
        filas.push(['    Iniciativa', i.titulo, i.scrumMasterNombre || '', '', i.estado, i.sprint || '', '']);
      });
    });
  });
  if (filas.length === 1) filas.push(['—', 'Sin objetivos en este trimestre', '', '', '', '', '']);

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

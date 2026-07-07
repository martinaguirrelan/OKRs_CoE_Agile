/**
 * Seed.gs
 * Carga inicial de OKRs de ejemplo (objetivos + Key Results + iniciativas)
 * siguiendo buenas prácticas. Los baselines/metas son referenciales: el
 * usuario los ajusta luego. Idempotente por título de objetivo.
 */

/** Trimestre actual en formato AAAA-Qn (ej. 2026-Q3). */
function trimestreActual_() {
  const d = new Date();
  return d.getFullYear() + '-Q' + (Math.floor(d.getMonth() / 3) + 1);
}

/** Devuelve la gerencia por nombre; la crea si no existe. */
function obtenerOCrearGerencia_(nombre) {
  const ex = listGerencias().filter(function (g) { return g.nombre === nombre; });
  return ex.length ? ex[0] : saveGerencia({ nombre: nombre });
}

/** Definición de los OKRs de ejemplo. */
const SEED_OKRS = [
  {
    titulo: 'Consolidar a los Agilistas como referente de valor que eleva la experiencia de los equipos',
    krs: [
      { descripcion: 'Incrementar el NPS de Agilista', unidad: 'pts', baseline: 88, meta: 95 },
      { descripcion: 'Cobertura de acompañamiento: squads con Agilista activo y sesiones periódicas', unidad: '%', baseline: 0, meta: 100 },
      { descripcion: 'Recomendaciones del Agilista implementadas por los equipos', unidad: '%', baseline: 0, meta: 80 }
    ]
  },
  {
    titulo: 'Entregar con confiabilidad y a tiempo el portafolio de iniciativas de Desarrollo de Software y Data',
    krs: [
      { descripcion: 'Iniciativas entregadas en la fecha comprometida (on-time)', unidad: '%', baseline: 0, meta: 90 },
      { descripcion: 'Cumplimiento del portafolio comprometido del trimestre', unidad: '%', baseline: 0, meta: 95 },
      { descripcion: 'Predictibilidad (say-do ratio: compromisos de sprint cumplidos)', unidad: '%', baseline: 0, meta: 85 }
    ]
  },
  {
    titulo: 'Asegurar entregas de Software y Data con calidad de primer nivel',
    krs: [
      { descripcion: 'Reducir defectos en producción — bugs críticos/mes (ajustar a tu nº actual y su mitad)', unidad: 'nº', baseline: 10, meta: 5 },
      { descripcion: 'Cobertura de pruebas automatizadas', unidad: '%', baseline: 0, meta: 80 },
      { descripcion: 'Entregas aceptadas sin reproceso (menor tasa de rechazo en QA)', unidad: '%', baseline: 0, meta: 90 }
    ]
  },
  {
    titulo: 'Elevar la madurez ágil de las tribus con backlogs sólidos y eventos bien ejecutados',
    krs: [
      { descripcion: 'Historias de usuario que cumplen el Definition of Ready (INVEST)', unidad: '%', baseline: 0, meta: 90 },
      { descripcion: 'Squads con backlog refinado a ≥2 sprints de anticipación', unidad: '%', baseline: 0, meta: 100 },
      { descripcion: 'Score de assessment de madurez ágil', unidad: 'pts (1-5)', baseline: 0, meta: 4 },
      { descripcion: 'Eventos ágiles ejecutados con efectividad (agenda/objetivo cumplido)', unidad: '%', baseline: 0, meta: 90 }
    ]
  },
  {
    titulo: 'Impulsar una cultura ágil formando a líderes y roles clave en toda la organización',
    krs: [
      { descripcion: 'Track 1 — Gerentes + Squads + Líder de Tribu capacitados', unidad: '%', baseline: 0, meta: 100 },
      { descripcion: 'Track 2 — BO, PO, LT y TPO capacitados', unidad: '%', baseline: 0, meta: 90 },
      { descripcion: 'Aprobación de la evaluación de conocimiento (ambos tracks)', unidad: '%', baseline: 0, meta: 80 }
    ],
    iniciativas: [
      { titulo: 'Diseñar y ejecutar el Track 1 (Gerentes + Squads + Líder de Tribu)', krIndex: 0 },
      { titulo: 'Diseñar y ejecutar el Track 2 (BO / PO / LT / TPO)', krIndex: 1 },
      { titulo: 'Construir la evaluación de conocimiento y medir aprobación', krIndex: 2 }
    ]
  }
];

/**
 * Crea los OKRs de ejemplo en la gerencia "CoE Ágil" y el trimestre actual.
 * Omite los objetivos que ya existan (por título) para no duplicar.
 */
function sembrarOKRsEjemplo() {
  setupSpreadsheet();
  const trimestre = trimestreActual_();
  const ger = obtenerOCrearGerencia_('CoE Ágil');

  const existentes = {};
  listObjetivos().forEach(function (o) { existentes[o.titulo] = true; });

  let objetivos = 0, keyResults = 0, iniciativas = 0, omitidos = 0;

  SEED_OKRS.forEach(function (s) {
    if (existentes[s.titulo]) { omitidos++; return; }
    const obj = saveObjetivo({ titulo: s.titulo, trimestre: trimestre, gerenciaId: ger.id });
    objetivos++;

    const krIds = [];
    s.krs.forEach(function (kr) {
      const saved = saveKeyResult({
        objetivoId: obj.id, descripcion: kr.descripcion, unidad: kr.unidad,
        baseline: kr.baseline, meta: kr.meta, actual: kr.baseline
      });
      krIds.push(saved.id);
      keyResults++;
    });

    (s.iniciativas || []).forEach(function (ini) {
      saveIniciativa({ krId: krIds[ini.krIndex], titulo: ini.titulo, estado: 'pendiente' });
      iniciativas++;
    });
  });

  return { objetivos: objetivos, keyResults: keyResults, iniciativas: iniciativas,
    omitidos: omitidos, trimestre: trimestre, gerencia: ger.nombre };
}

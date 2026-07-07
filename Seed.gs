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

/** Definición de los OKRs de ejemplo (redacción y medición mejoradas). */
const SEED_OKRS = [
  {
    titulo: 'Consolidar a los Agilistas como referente de valor que eleva la experiencia de los equipos',
    krs: [
      { descripcion: 'Elevar el NPS de Agilista percibido por los equipos', unidad: 'pts', baseline: 88, meta: 95,
        medicion: 'NPS = % promotores − % detractores, encuesta trimestral a los equipos acompañados' },
      { descripcion: '% de squads con al menos 1 sesión de coaching quincenal', unidad: '%', baseline: 0, meta: 100,
        medicion: '(squads con ≥1 sesión de coaching en la quincena / total de squads) × 100' },
      { descripcion: '% de recomendaciones del Agilista implementadas por los equipos', unidad: '%', baseline: 0, meta: 80,
        medicion: '(recomendaciones implementadas / recomendaciones acordadas en las sesiones) × 100' }
    ]
  },
  {
    titulo: 'Entregar con confiabilidad y a tiempo el portafolio de iniciativas de Desarrollo de Software y Data',
    krs: [
      { descripcion: '% de iniciativas entregadas dentro de la fecha comprometida', unidad: '%', baseline: 0, meta: 90,
        medicion: '(iniciativas entregadas ≤ fecha comprometida / iniciativas comprometidas) × 100' },
      { descripcion: '% de alcance del portafolio comprometido completado en el trimestre', unidad: '%', baseline: 0, meta: 95,
        medicion: '(iniciativas del portafolio completadas / iniciativas del portafolio comprometidas) × 100' },
      { descripcion: 'Say-do ratio: % de compromisos de sprint cumplidos', unidad: '%', baseline: 0, meta: 85,
        medicion: '(compromisos completados / compromisos asumidos al inicio del sprint) × 100, promedio del trimestre' }
    ]
  },
  {
    titulo: 'Asegurar entregas de Software y Data con calidad de primer nivel',
    krs: [
      { descripcion: 'Reducir los defectos críticos en producción por mes', unidad: 'nº', baseline: 10, meta: 5,
        medicion: 'Nº de defectos de severidad crítica reportados en producción por mes (promedio del trimestre)' },
      { descripcion: '% de cobertura de pruebas automatizadas', unidad: '%', baseline: 0, meta: 80,
        medicion: '(casos/líneas cubiertos por pruebas automatizadas / total) × 100, reportado por la herramienta de CI' },
      { descripcion: '% de entregas aceptadas a la primera (sin reproceso)', unidad: '%', baseline: 0, meta: 90,
        medicion: '(entregas aprobadas a la primera / total de entregas a QA) × 100' }
    ]
  },
  {
    titulo: 'Elevar la madurez ágil de las tribus con backlogs sólidos y eventos bien ejecutados',
    krs: [
      { descripcion: '% de historias de usuario que cumplen el Definition of Ready (INVEST)', unidad: '%', baseline: 0, meta: 90,
        medicion: '(HU que cumplen el checklist DoR / HU revisadas) × 100' },
      { descripcion: '% de squads con backlog refinado a ≥2 sprints de anticipación', unidad: '%', baseline: 0, meta: 100,
        medicion: '(squads con backlog refinado ≥2 sprints / total de squads) × 100' },
      { descripcion: 'Elevar el score del assessment de madurez ágil', unidad: 'pts (1-5)', baseline: 0, meta: 4,
        medicion: 'Promedio del assessment de madurez ágil (escala 1–5) aplicado a los squads' },
      { descripcion: '% de ceremonias ágiles ejecutadas conforme a su checklist', unidad: '%', baseline: 0, meta: 90,
        medicion: '(ceremonias con checklist de calidad cumplido / ceremonias planificadas) × 100' }
    ]
  },
  {
    titulo: 'Impulsar una cultura ágil formando a líderes y roles clave en toda la organización',
    krs: [
      { descripcion: '% de aprobación de la evaluación de conocimiento ágil (ambos tracks)', unidad: '%', baseline: 0, meta: 80,
        medicion: '(participantes que aprueban la evaluación / participantes evaluados) × 100' },
      { descripcion: '% de participantes que aplican ≥1 práctica ágil a las 4 semanas de la formación', unidad: '%', baseline: 0, meta: 70,
        medicion: 'Seguimiento post-capacitación: (participantes que aplican ≥1 práctica / total capacitados) × 100' },
      { descripcion: '% de cobertura de formación de los roles clave (Gerentes, LT, BO, PO, TPO)', unidad: '%', baseline: 0, meta: 100,
        medicion: '(roles clave capacitados / roles clave objetivo) × 100' }
    ],
    iniciativas: [
      { titulo: 'Diseñar y ejecutar el Track 1 (Gerentes + Squads + Líder de Tribu)', krIndex: 2 },
      { titulo: 'Diseñar y ejecutar el Track 2 (BO / PO / LT / TPO)', krIndex: 2 },
      { titulo: 'Construir la evaluación de conocimiento y medir aprobación', krIndex: 0 }
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
        baseline: kr.baseline, meta: kr.meta, actual: kr.baseline, medicion: kr.medicion
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

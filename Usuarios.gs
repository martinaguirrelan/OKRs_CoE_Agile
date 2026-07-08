/**
 * Usuarios.gs
 * Control de acceso por gerencia. Cada usuario (por email) tiene una gerencia
 * y un rol: admin (todo), editor (solo su gerencia), lector (solo lectura de
 * su gerencia). La identidad se obtiene de Session.getActiveUser().
 *
 * Bootstrap: mientras la hoja Usuarios esté vacía, todos son admin (para no
 * bloquear la configuración inicial). En cuanto se registra el primer usuario,
 * el control queda activo y los no listados quedan "sin-acceso".
 */

const ROLES = { ADMIN: 'admin', EDITOR: 'editor', LECTOR: 'lector', SIN_ACCESO: 'sin-acceso' };

function listUsuarios() {
  return readAll_(SHEETS.USUARIOS).sort(function (a, b) {
    return String(a.email).localeCompare(String(b.email));
  });
}

/** Email del usuario que accede (en minúsculas), o '' si no se detecta. */
function emailActual_() {
  try { return (Session.getActiveUser().getEmail() || '').toLowerCase().trim(); } catch (e) { return ''; }
}

/**
 * Devuelve { email, rol, gerenciaId, bootstrap } del usuario actual.
 * bootstrap=true indica que aún no hay usuarios configurados (todos admin).
 */
function getUsuarioActual_() {
  const email = emailActual_();

  // El propietario del script (quien lo ejecuta/despliega) siempre es admin:
  // así el menú y el seed funcionan y nunca queda bloqueado.
  let owner = '';
  try { owner = (Session.getEffectiveUser().getEmail() || '').toLowerCase().trim(); } catch (e) {}
  if (email && owner && email === owner) {
    return { email: email, rol: ROLES.ADMIN, gerenciaId: '', bootstrap: false, owner: true };
  }

  const usuarios = listUsuarios();
  if (!usuarios.length) {
    return { email: email, rol: ROLES.ADMIN, gerenciaId: '', bootstrap: true };
  }
  const u = usuarios.filter(function (x) {
    return String(x.email).toLowerCase().trim() === email;
  })[0];
  if (u) {
    return { email: email, rol: u.rol || ROLES.LECTOR, gerenciaId: u.gerenciaId || '', bootstrap: false };
  }
  return { email: email, rol: ROLES.SIN_ACCESO, gerenciaId: '', bootstrap: false };
}

// ---------- Resolución de gerencia de cada entidad ----------

function gerenciaDeObjetivo_(objetivoId) {
  const o = readAll_(SHEETS.OBJETIVOS).filter(function (x) {
    return String(x.id) === String(objetivoId);
  })[0];
  return o ? o.gerenciaId : '';
}

function gerenciaDeKR_(krId) {
  const kr = readAll_(SHEETS.KEY_RESULTS).filter(function (x) {
    return String(x.id) === String(krId);
  })[0];
  return kr ? gerenciaDeObjetivo_(kr.objetivoId) : '';
}

// ---------- Guardas de permisos (lanzan error si no autorizado) ----------

function assertAdmin_() {
  const u = getUsuarioActual_();
  if (u.rol !== ROLES.ADMIN) throw new Error('Solo un administrador puede realizar esta acción.');
  return u;
}

/** Verifica que el usuario pueda escribir algo (admin o editor, no lector). */
function assertPuedeEscribir_() {
  const u = getUsuarioActual_();
  if (u.rol === ROLES.ADMIN || u.rol === ROLES.EDITOR) return u;
  throw new Error('No tienes permiso para esta acción.');
}

/** Verifica que el usuario pueda editar contenido de la gerencia indicada. */
function assertEditarGerencia_(gerenciaId) {
  const u = getUsuarioActual_();
  if (u.rol === ROLES.ADMIN) return u;
  if (u.rol === ROLES.EDITOR && gerenciaId && String(u.gerenciaId) === String(gerenciaId)) return u;
  throw new Error('No tienes permiso para editar información de esta gerencia.');
}

// ---------- CRUD de usuarios (solo admin) ----------

function saveUsuario(data) {
  assertAdmin_();
  const rolesValidos = [ROLES.ADMIN, ROLES.EDITOR, ROLES.LECTOR];
  const usuario = {
    email: (data.email || '').toLowerCase().trim(),
    gerenciaId: data.gerenciaId || '',
    rol: rolesValidos.indexOf(data.rol) !== -1 ? data.rol : ROLES.LECTOR
  };
  if (!usuario.email) throw new Error('El usuario necesita un email.');
  if (usuario.rol !== ROLES.ADMIN && !usuario.gerenciaId) {
    throw new Error('Editor y lector requieren una gerencia asignada.');
  }
  return upsert_(SHEETS.USUARIOS, usuario);
}

function deleteUsuario(email) {
  assertAdmin_();
  return remove_(SHEETS.USUARIOS, String(email).toLowerCase().trim());
}

const test = require('node:test');
const assert = require('node:assert/strict');
let estado;
let escrituras;
let borrados;
const referencia = (coleccion, id) => ({
  id, coleccion,
  collection: sub => ({ sub, padre: id }),
  delete: async () => borrados.push(`sala:${id}`),
});
const db = {
  collection: nombre => ({ doc: id => referencia(nombre, id) }),
  runTransaction: async callback => callback({
    getAll: async (...refs) => refs.map(ref => (ref.coleccion === 'users' ? estado.perfil : estado.sala)),
    update: (ref, datos) => escrituras.push({ id: ref.id, datos }),
  }),
  recursiveDelete: async ref => borrados.push(`mensajes:${ref.padre}`),
};
const config = require.resolve('../dist/config/firebase.js');
require.cache[config] = { id: config, filename: config, loaded: true, exports: { db } };
const { actualizarSala, eliminarSala } = require('../dist/services/salas.service.js');
const doc = (existe, datos = {}) => ({ exists: existe, get: campo => datos[campo] });
test.beforeEach(() => {
  escrituras = [];
  borrados = [];
  estado = { sala: doc(true, { nombre: 'Estudio', propietarioUid: 'anfitrion' }), perfil: doc(true) };
});
test('el anfitrión cambia el nombre de su sala', async () => {
  const sala = await actualizarSala('anfitrion', 'Ab3_xY-9', 'Nuevo nombre');
  assert.deepEqual(sala, { id: 'Ab3_xY-9', nombre: 'Nuevo nombre', rol: 'administrador' });
  assert.deepEqual(escrituras, [{ id: 'Ab3_xY-9', datos: { nombre: 'Nuevo nombre' } }]);
});
test('un participante no puede editar: SIN_PERMISO y no se escribe nada', async () => {
  await assert.rejects(actualizarSala('otra-persona', 'Ab3_xY-9', 'Nuevo'), /SIN_PERMISO/);
  assert.equal(escrituras.length, 0);
});
test('editar una sala inexistente o en eliminación devuelve SALA_NO_EXISTE', async () => {
  estado.sala = doc(false);
  await assert.rejects(actualizarSala('anfitrion', 'Ab3_xY-9', 'Nuevo'), /SALA_NO_EXISTE/);
  estado.sala = doc(true, { propietarioUid: 'anfitrion', eliminando: true });
  await assert.rejects(actualizarSala('anfitrion', 'Ab3_xY-9', 'Nuevo'), /SALA_NO_EXISTE/);
  assert.equal(escrituras.length, 0);
});
test('sin perfil no se puede gestionar una sala', async () => {
  estado.perfil = doc(false);
  await assert.rejects(actualizarSala('anfitrion', 'Ab3_xY-9', 'Nuevo'), /PERFIL_NO_EXISTE/);
  await assert.rejects(eliminarSala('anfitrion', 'Ab3_xY-9'), /PERFIL_NO_EXISTE/);
});
test('el anfitrión elimina la sala: la marca, borra el chat y luego la sala', async () => {
  await eliminarSala('anfitrion', 'Ab3_xY-9');
  assert.deepEqual(escrituras, [{ id: 'Ab3_xY-9', datos: { eliminando: true } }]);
  assert.deepEqual(borrados, ['mensajes:Ab3_xY-9', 'sala:Ab3_xY-9']);
});
test('un participante no puede eliminar: SIN_PERMISO y no se borra nada', async () => {
  await assert.rejects(eliminarSala('otra-persona', 'Ab3_xY-9'), /SIN_PERMISO/);
  assert.equal(escrituras.length, 0);
  assert.equal(borrados.length, 0);
});
test('eliminar una sala inexistente devuelve SALA_NO_EXISTE', async () => {
  estado.sala = doc(false);
  await assert.rejects(eliminarSala('anfitrion', 'Ab3_xY-9'), /SALA_NO_EXISTE/);
  assert.equal(borrados.length, 0);
});
test('el anfitrión puede reintentar una eliminación interrumpida', async () => {
  estado.sala = doc(true, { propietarioUid: 'anfitrion', eliminando: true });
  await eliminarSala('anfitrion', 'Ab3_xY-9');
  assert.deepEqual(borrados, ['mensajes:Ab3_xY-9', 'sala:Ab3_xY-9']);
});
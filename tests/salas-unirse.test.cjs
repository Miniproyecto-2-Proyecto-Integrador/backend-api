const test = require('node:test');
const assert = require('node:assert/strict');
let documentos;
const db = {
  collection: nombre => ({ doc: id => ({ id, coleccion: nombre }) }),
  getAll: async (sala, perfil) => [documentos.sala, documentos.perfil],
};
const config = require.resolve('../dist/config/firebase.js');
require.cache[config] = { id: config, filename: config, loaded: true, exports: { db } };
const { esIdSalaValido, obtenerSala } = require('../dist/services/salas.service.js');
const doc = (existe, datos = {}, id = 'Ab3_xY-9') => ({ id, exists: existe, get: campo => datos[campo] });
test.beforeEach(() => {
  documentos = { sala: doc(true, { nombre: 'Estudio', propietarioUid: 'anfitrion' }), perfil: doc(true) };
});
test('acepta IDs de 8 y 20 caracteres y rechaza vacíos, espacios y rutas', () => {
  for (const id of ['Ab3_xY-9', 'ABCDEFGHIJKLMNOPQRST']) assert.equal(esIdSalaValido(id), true);
  for (const id of ['', '   ', 'Ab3 xY-9', '../rooms', '1234567', null, 12345678]) assert.equal(esIdSalaValido(id), false);
});
test('un participante entra con rol participante', async () => {
  assert.deepEqual(await obtenerSala('otra-persona', 'Ab3_xY-9'), { id: 'Ab3_xY-9', nombre: 'Estudio', rol: 'participante' });
});
test('el propietario recibe rol administrador', async () => {
  assert.equal((await obtenerSala('anfitrion', 'Ab3_xY-9')).rol, 'administrador');
});
test('una sala inexistente o en eliminación devuelve null', async () => {
  documentos.sala = doc(false);
  assert.equal(await obtenerSala('anfitrion', 'Ab3_xY-9'), null);
  documentos.sala = doc(true, { eliminando: true });
  assert.equal(await obtenerSala('anfitrion', 'Ab3_xY-9'), null);
});
test('sin perfil no se puede consultar la sala', async () => {
  documentos.perfil = doc(false);
  await assert.rejects(obtenerSala('anfitrion', 'Ab3_xY-9'), /PERFIL_NO_EXISTE/);
});
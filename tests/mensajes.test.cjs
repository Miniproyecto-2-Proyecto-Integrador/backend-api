const test = require('node:test');
const assert = require('node:assert/strict');
const { Timestamp } = require('firebase-admin/firestore');
let estado;
let llamadas;
const consulta = {
  orderBy(campo, orden) { llamadas.orden.push([typeof campo === 'string' ? campo : 'id', orden]); return this; },
  startAfter(...valores) { llamadas.startAfter = valores; return this; },
  limit(n) { llamadas.limit = n; return this; },
  get: async () => ({ docs: estado.mensajes.slice(0, llamadas.limit) }),
};
const db = {
  collection: nombre => ({
    doc: id => ({ id, coleccion: nombre, collection: () => consulta }),
  }),
  getAll: async () => [estado.sala, estado.perfil],
};
const config = require.resolve('../dist/config/firebase.js');
require.cache[config] = { id: config, filename: config, loaded: true, exports: { db } };
const { leerCursor, listarMensajes } = require('../dist/services/mensajes.service.js');
const doc = (existe, datos = {}, id = 'x') => ({ id, exists: existe, get: campo => datos[campo] });
const mensaje = (id, segundos, autorUid, texto = id) =>
  doc(true, { autor: autorUid ?? 'Cuenta eliminada', autorUid, texto, creadoEn: new Timestamp(segundos, 0) }, id);
test.beforeEach(() => {
  llamadas = { orden: [] };
  estado = { sala: doc(true, {}, 'Ab3_xY-9'), perfil: doc(true), mensajes: [] };
});
test('entrega los mensajes en orden cronológico y marca los propios', async () => {
  estado.mensajes = [mensaje('m3', 300, 'yo'), mensaje('m2', 200, 'otra'), mensaje('m1', 100, 'yo')];
  const r = await listarMensajes('yo', 'Ab3_xY-9', 50);
  assert.deepEqual(r.mensajes.map(m => m.id), ['m1', 'm2', 'm3']);
  assert.deepEqual(r.mensajes.map(m => m.esPropio), [true, false, true]);
  assert.equal(r.mensajes[0].creadoEn, new Date(100000).toISOString());
  assert.equal(r.hayMas, false);
  assert.equal(r.siguienteCursor, null);
});
test('pide del más reciente al más antiguo y uno de más para saber si hay más', async () => {
  await listarMensajes('yo', 'Ab3_xY-9', 50);
  assert.deepEqual(llamadas.orden, [['creadoEn', 'desc'], ['id', 'desc']]);
  assert.equal(llamadas.limit, 51);
});
test('con más mensajes que el límite indica hayMas y el cursor del más antiguo de la parte', async () => {
  estado.mensajes = [mensaje('m3', 300, 'a'), mensaje('m2', 200, 'a'), mensaje('m1', 100, 'a')];
  const r = await listarMensajes('yo', 'Ab3_xY-9', 2);
  assert.deepEqual(r.mensajes.map(m => m.id), ['m2', 'm3']);
  assert.equal(r.hayMas, true);
  assert.equal(r.siguienteCursor, '200_0_m2');
});
test('con cursor continúa después de ese mensaje', async () => {
  await listarMensajes('yo', 'Ab3_xY-9', 50, { segundos: 200, nanos: 0, id: 'm2' });
  assert.equal(llamadas.startAfter[0].seconds, 200);
  assert.equal(llamadas.startAfter[1], 'm2');
});
test('un historial vacío devuelve lista vacía', async () => {
  assert.deepEqual(await listarMensajes('yo', 'Ab3_xY-9', 50), { mensajes: [], hayMas: false, siguienteCursor: null });
});
test('los mensajes de una cuenta eliminada no son propios', async () => {
  estado.mensajes = [mensaje('m1', 100, undefined)];
  const r = await listarMensajes('yo', 'Ab3_xY-9', 50);
  assert.equal(r.mensajes[0].esPropio, false);
  assert.equal(r.mensajes[0].autor, 'Cuenta eliminada');
});
test('sala inexistente, en eliminación o usuario sin perfil se rechazan', async () => {
  estado.sala = doc(false);
  await assert.rejects(listarMensajes('yo', 'Ab3_xY-9', 50), /SALA_NO_EXISTE/);
  estado.sala = doc(true, { eliminando: true });
  await assert.rejects(listarMensajes('yo', 'Ab3_xY-9', 50), /SALA_NO_EXISTE/);
  estado.sala = doc(true);
  estado.perfil = doc(false);
  await assert.rejects(listarMensajes('yo', 'Ab3_xY-9', 50), /PERFIL_NO_EXISTE/);
});
test('leerCursor acepta el formato esperado y rechaza lo demás', () => {
  assert.deepEqual(leerCursor('200_5_m2'), { segundos: 200, nanos: 5, id: 'm2' });
  for (const valor of ['', 'abc', '200_m2', '200_0_a/b', '200_0_', undefined, 12, ['200_0_m2']]) assert.equal(leerCursor(valor), null);
});
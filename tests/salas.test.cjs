const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
let colisiones = 0;
let perfilExiste = true;
let escrituras;
let lecturas;
const db = {
  collection: nombre => ({ doc: id => ({ id, collection: nombre }) }),
  runTransaction: async callback => callback({
    getAll: async (perfil, sala) => {
      lecturas.push({ perfil, sala });
      return [{ exists: perfilExiste, get: () => false }, { exists: colisiones-- > 0 }];
    },
    create: (ref, datos) => escrituras.push({ ref, datos }),
  }),
};
const config = require.resolve('../dist/config/firebase.js');
require.cache[config] = { id: config, filename: config, loaded: true, exports: { db } };
const { crearSala } = require('../dist/services/salas.service.js');
test.beforeEach(() => { colisiones = 0; perfilExiste = true; escrituras = []; lecturas = []; });
test('crea una sala con ID de ocho caracteres URL-safe y el propietario autenticado', async () => {
  const sala = await crearSala('usuario-A', 'Estudio');
  assert.match(sala.id, /^[A-Za-z0-9_-]{8}$/);
  assert.equal(escrituras.length, 1);
  assert.equal(escrituras[0].ref.id, sala.id);
  assert.equal(escrituras[0].datos.propietarioUid, 'usuario-A');
});
test('una colisión genera otro candidato sin sobrescribir la sala existente', async t => {
  let contador = 0;
  t.mock.method(crypto, 'randomBytes', () => Buffer.alloc(6, ++contador));
  colisiones = 1;
  const sala = await crearSala('usuario-A', 'Estudio');
  assert.equal(lecturas.length, 2);
  assert.notEqual(lecturas[0].sala.id, sala.id);
  assert.equal(escrituras.length, 1);
  assert.equal(escrituras[0].ref.id, sala.id);
});
test('limita los reintentos si todos los IDs están ocupados', async () => {
  colisiones = 10;
  await assert.rejects(crearSala('usuario-A', 'Estudio'), /ID de sala disponible/);
  assert.equal(lecturas.length, 5);
  assert.equal(escrituras.length, 0);
});
test('sin perfil no crea una sala ni reintenta', async () => {
  perfilExiste = false;
  await assert.rejects(crearSala('usuario-A', 'Estudio'), /PERFIL_NO_EXISTE/);
  assert.equal(lecturas.length, 1);
  assert.equal(escrituras.length, 0);
});

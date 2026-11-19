const test = require('node:test');
const assert = require('node:assert/strict');
const servicePath = require.resolve('../dist/services/usuarios.service.js');
let consultar;
require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {
  obtenerPerfil: uid => consultar(uid),
} };
const { obtenerMiPerfil } = require('../dist/controllers/usuarios.controller.js');

for (const perfil of [null, { username: 'prueba', correo: 'prueba@example.com' }]) {
  test(perfil ? 'GET devuelve el perfil existente' : 'GET sin perfil devuelve 200 con data null', async () => {
    consultar = async uid => { assert.equal(uid, 'uid-prueba'); return perfil; };
    const res = {
      locals: { uid: 'uid-prueba' },
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await obtenerMiPerfil({}, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { success: true, data: perfil });
  });
}
test('un fallo al consultar conserva 500', async t => {
  consultar = async () => { throw new Error('Fallo de almacenamiento'); };
  t.mock.method(console, 'error', () => {});
  const res = { locals: { uid: 'uid-prueba' }, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await obtenerMiPerfil({}, res);
  assert.equal(res.code, 500);
  assert.equal(res.body.success, false);
});

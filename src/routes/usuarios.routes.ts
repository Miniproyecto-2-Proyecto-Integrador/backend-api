import { Router } from "express";
import { crearUsuario, obtenerMiPerfil } from "../controllers/usuarios.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { eliminarCuenta } from "../services/eliminarCuenta.service";

const router = Router();

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear el perfil del usuario con sesión
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombres, apellidos, username, avatar]
 *             properties:
 *               nombres:
 *                 type: string
 *                 example: Samuel
 *               apellidos:
 *                 type: string
 *                 example: Banguero
 *               username:
 *                 type: string
 *                 description: De 3 a 20 caracteres (letras, números o guion bajo). Debe ser único.
 *                 example: samuel_b
 *               avatar:
 *                 type: string
 *                 example: avatar1
 *     responses:
 *       201:
 *         description: Perfil creado
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Perfil creado correctamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Revisa los datos del formulario.
 *               errores:
 *                 username: El nombre de usuario debe tener de 3 a 20 caracteres.
 *       401:
 *         description: Sin sesión o token inválido
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No autorizado: debes iniciar sesión"
 *       409:
 *         description: Nombre de usuario ocupado o el usuario ya tiene perfil
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Ese nombre de usuario ya está en uso.
 *               errores:
 *                 username: Ese nombre de usuario ya está en uso. Prueba con otro.
 *       500:
 *         description: Error del servidor
 */
router.post("/usuarios", verificarToken, crearUsuario);

/**
 * @swagger
 * /api/usuarios/yo:
 *   delete:
 *     summary: Eliminar definitivamente la cuenta con sesión
 *     description: Borra el perfil, las salas propias y su chat, libera el username y conserva los mensajes de salas ajenas con el autor Cuenta eliminada.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204: { description: Cuenta eliminada }
 *       401: { description: Sesión inválida }
 *       500: { description: Error del servidor }
 */
router.delete("/usuarios/yo", verificarToken, async (_req, res) => {
  try {
    await eliminarCuenta(res.locals.uid);
    res.status(204).end();
  } catch (error) {
    console.error("No se pudo eliminar la cuenta", (error as { code?: string }).code);
    res.status(500).json({ success: false, message: "No pudimos eliminar tu cuenta. Intenta de nuevo." });
  }
});

/**
 * @swagger
 * /api/usuarios/yo:
 *   get:
 *     summary: Obtener el perfil del usuario con sesión
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 nombres: Samuel
 *                 apellidos: Banguero
 *                 username: samuel_b
 *                 avatar: avatar1
 *                 correo: samuel@correo.com
 *                 creadoEn: "2026-11-10T03:00:00.000Z"
 *       401:
 *         description: Sin sesión o token inválido
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No autorizado: debes iniciar sesión"
 *       404:
 *         description: El usuario aún no tiene perfil
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Este usuario aún no tiene perfil.
 *       500:
 *         description: Error del servidor
 */
router.get("/usuarios/yo", verificarToken, obtenerMiPerfil);

export default router;

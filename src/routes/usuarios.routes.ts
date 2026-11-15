import { Router } from "express";
import { crearUsuario, editarMiPerfil, obtenerMiPerfil } from "../controllers/usuarios.controller";
import { verificarToken } from "../middlewares/verificarToken";

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

/**
 * @swagger
 * /api/usuarios/yo:
 *   patch:
 *     summary: Editar los campos enviados del perfil propio
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               nombres: { type: string, maxLength: 50 }
 *               apellidos: { type: string, maxLength: 50 }
 *               username: { type: string, minLength: 3, maxLength: 20 }
 *               avatar: { type: string, maxLength: 300 }
 *               correo: { type: string, format: email }
 *     responses:
 *       200: { description: Perfil actualizado }
 *       400: { description: Datos inválidos }
 *       401: { description: Sesión inválida }
 *       404: { description: Perfil inexistente }
 *       409: { description: Correo o nombre de usuario ocupado }
 *       500: { description: Error del servidor }
 */
router.patch("/usuarios/yo", verificarToken, editarMiPerfil);

export default router;

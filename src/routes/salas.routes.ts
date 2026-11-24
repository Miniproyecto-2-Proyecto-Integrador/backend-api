import { Response, Router } from "express";
import { verificarToken } from "../middlewares/verificarToken";
import { actualizarSala, crearSala, eliminarSala, esIdSalaValido, listarSalasPropias, obtenerSala } from "../services/salas.service";

const router = Router();
const MAX_NOMBRE_SALA = 80;

/**
 * @swagger
 * /api/salas:
 *   post:
 *     summary: Crear una sala como administrador con ID aleatorio de 8 caracteres
 *     tags: [Salas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string, minLength: 1, maxLength: 80 }
 *     responses:
 *       201:
 *         description: Sala creada
 *         content:
 *           application/json:
 *             example: { success: true, data: { id: "Ab3_xY-9", nombre: Estudio, rol: administrador } }
 *       400: { description: Nombre inválido }
 *       401: { description: Sesión inválida }
 *       404: { description: El usuario aún no tiene perfil }
 *       500: { description: Error del servidor }
 *   get:
 *     summary: Listar las salas creadas por el usuario con sesión
 *     tags: [Salas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Salas propias (lista vacía cuando no hay salas)
 *         content:
 *           application/json:
 *             example: { success: true, data: [] }
 *       401: { description: Sesión inválida }
 *       500: { description: Error del servidor }
 *
 * /api/salas/{id}:
 *   get:
 *     summary: Consultar una sala por su ID para unirse (US-08)
 *     description: Devuelve la sala si existe y el rol de quien consulta. Los espacios al inicio o al final del ID se ignoran.
 *     tags: [Salas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID de la sala (8 caracteres, letras, números, guion o guion bajo)
 *     responses:
 *       200:
 *         description: Sala encontrada
 *         content:
 *           application/json:
 *             example: { success: true, data: { id: "Ab3_xY-9", nombre: Estudio, rol: participante } }
 *       400: { description: ID vacío o con formato inválido }
 *       401: { description: Sesión inválida }
 *       404: { description: Sala no encontrada o el usuario aún no tiene perfil }
 *       500: { description: Error del servidor }
 *   patch:
 *     summary: Editar el nombre de una sala (solo el anfitrión)
 *     tags: [Salas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string, minLength: 1, maxLength: 80 }
 *     responses:
 *       200:
 *         description: Sala actualizada
 *         content:
 *           application/json:
 *             example: { success: true, data: { id: "Ab3_xY-9", nombre: Nuevo nombre, rol: administrador } }
 *       400: { description: ID o nombre inválido }
 *       401: { description: Sesión inválida }
 *       403: { description: Quien consulta no es el anfitrión de la sala }
 *       404: { description: Sala no encontrada o el usuario aún no tiene perfil }
 *       500: { description: Error del servidor }
 *   delete:
 *     summary: Eliminar una sala y su chat (solo el anfitrión)
 *     tags: [Salas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sala eliminada
 *         content:
 *           application/json:
 *             example: { success: true, message: Sala eliminada }
 *       400: { description: ID inválido }
 *       401: { description: Sesión inválida }
 *       403: { description: Quien consulta no es el anfitrión de la sala }
 *       404: { description: Sala no encontrada o el usuario aún no tiene perfil }
 *       500: { description: Error del servidor }
 */
router.post("/salas", verificarToken, async (req, res) => {
  const entrada: unknown = req.body?.nombre;
  const nombre = typeof entrada === "string" ? entrada.trim() : "";
  if (!nombre || Array.from(nombre).length > MAX_NOMBRE_SALA) {
    res.status(400).json({ success: false, message: "Escribe un nombre de sala de 1 a 80 caracteres." });
    return;
  }
  try {
    const data = await crearSala(res.locals.uid, nombre);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "PERFIL_NO_EXISTE") {
      res.status(404).json({ success: false, message: "Completa tu perfil antes de crear una sala." });
      return;
    }
    console.error("No se pudo crear la sala", (error as { code?: string }).code);
    res.status(500).json({ success: false, message: "No pudimos crear la sala. Intenta de nuevo." });
  }
});

router.get("/salas", verificarToken, async (_req, res) => {
  try {
    const data = await listarSalasPropias(res.locals.uid);
    res.json({ success: true, data });
  } catch (error) {
    console.error("No se pudieron listar las salas", (error as { code?: string }).code);
    res.status(500).json({ success: false, message: "No pudimos cargar tus salas. Intenta de nuevo." });
  }
});

router.get("/salas/:id", verificarToken, async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  if (!esIdSalaValido(id)) {
    res.status(400).json({
      success: false,
      message: "Escribe un ID de sala válido: 8 caracteres entre letras, números, guion o guion bajo.",
    });
    return;
  }
  try {
    const data = await obtenerSala(res.locals.uid, id);
    if (!data) {
      res.status(404).json({ success: false, message: "No encontramos una sala con ese ID. Revisa que esté bien escrito." });
      return;
    }
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "PERFIL_NO_EXISTE") {
      res.status(404).json({ success: false, message: "Completa tu perfil antes de unirte a una sala." });
      return;
    }
    console.error("No se pudo consultar la sala", (error as { code?: string }).code);
    res.status(500).json({ success: false, message: "No pudimos abrir la sala. Intenta de nuevo." });
  }
});

function responderErrorSala(res: Response, error: unknown, accion: string) {
  const mensaje = error instanceof Error ? error.message : "";
  if (mensaje === "SIN_PERMISO") {
    res.status(403).json({ success: false, message: "Solo el anfitrión puede editar o eliminar esta sala." });
    return;
  }
  if (mensaje === "SALA_NO_EXISTE") {
    res.status(404).json({ success: false, message: "No encontramos una sala con ese ID." });
    return;
  }
  if (mensaje === "PERFIL_NO_EXISTE") {
    res.status(404).json({ success: false, message: "Completa tu perfil antes de gestionar salas." });
    return;
  }
  console.error(`No se pudo ${accion} la sala`, (error as { code?: string }).code);
  res.status(500).json({ success: false, message: `No pudimos ${accion} la sala. Intenta de nuevo.` });
}

router.patch("/salas/:id", verificarToken, async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  const entrada: unknown = req.body?.nombre;
  const nombre = typeof entrada === "string" ? entrada.trim() : "";
  if (!esIdSalaValido(id)) {
    res.status(400).json({ success: false, message: "El ID de la sala no es válido." });
    return;
  }
  if (!nombre || Array.from(nombre).length > MAX_NOMBRE_SALA) {
    res.status(400).json({ success: false, message: "Escribe un nombre de sala de 1 a 80 caracteres." });
    return;
  }
  try {
    const data = await actualizarSala(res.locals.uid, id, nombre);
    res.json({ success: true, data });
  } catch (error) {
    responderErrorSala(res, error, "actualizar");
  }
});

router.delete("/salas/:id", verificarToken, async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  if (!esIdSalaValido(id)) {
    res.status(400).json({ success: false, message: "El ID de la sala no es válido." });
    return;
  }
  try {
    await eliminarSala(res.locals.uid, id);
    res.json({ success: true, message: "Sala eliminada." });
  } catch (error) {
    responderErrorSala(res, error, "eliminar");
  }
});

export default router;
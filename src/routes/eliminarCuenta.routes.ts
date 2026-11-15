import { Router } from "express";
import { verificarToken } from "../middlewares/verificarToken";
import { eliminarCuenta } from "../services/eliminarCuenta.service";

const router = Router();

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

export default router;

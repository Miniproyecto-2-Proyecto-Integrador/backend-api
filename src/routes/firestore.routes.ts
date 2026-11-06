import { Router } from "express";
import { consultarPruebas } from "../controllers/firestore.controller";

const router = Router();

/**
 * @swagger
 * /api/pruebas:
 *   get:
 *     summary: Consultar documentos de prueba
 *     description: Obtiene los documentos almacenados en la colección pruebas de Firestore.
 *     tags:
 *       - Firestore
 *     responses:
 *       200:
 *         description: Documentos consultados correctamente.
 *       500:
 *         description: Error interno al consultar Firestore.
 */
router.get("/pruebas", consultarPruebas);

export default router;
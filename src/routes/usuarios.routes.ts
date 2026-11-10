import { Router } from "express";
import { crearUsuario, obtenerMiPerfil } from "../controllers/usuarios.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/usuarios", verificarToken, crearUsuario);
router.get("/usuarios/yo", verificarToken, obtenerMiPerfil);

export default router;
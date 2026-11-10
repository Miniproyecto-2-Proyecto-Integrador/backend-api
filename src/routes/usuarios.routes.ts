import { Router } from "express";
import { crearUsuario } from "../controllers/usuarios.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/usuarios", verificarToken, crearUsuario);

export default router;
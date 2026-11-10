import { NextFunction, Request, Response } from "express";
import { auth } from "../config/firebase";

export async function verificarToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "No autorizado: debes iniciar sesión",
    });
    return;
  }

  const token = encabezado.split(" ")[1];

  try {
    const datos = await auth.verifyIdToken(token);
    res.locals.uid = datos.uid;
    res.locals.correo = datos.email;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "No autorizado: la sesión no es válida o expiró",
    });
  }
}
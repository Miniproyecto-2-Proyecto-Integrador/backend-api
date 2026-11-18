import { NextFunction, Request, Response } from "express";
import { auth, db } from "../config/firebase";

export async function verificarToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    // Temporary diagnostic for requests that reach Render without a Bearer token.
    console.error(
      "401 sin Bearer. Ruta:",
      req.method,
      req.originalUrl,
      "Encabezado presente:",
      Boolean(encabezado)
    );
    res.status(401).json({
      success: false,
      message: "No autorizado: debes iniciar sesión",
    });
    return;
  }

  const token = encabezado.split(" ")[1];

  try {
    const datos = await auth.verifyIdToken(token, true).catch(async (error) => {
      // Retry only a deletion already in progress after Auth removed the account.
      if (req.method !== "DELETE" || req.path !== "/usuarios/yo" ||
          error.code !== "auth/user-not-found") throw error;
      const sesion = await auth.verifyIdToken(token);
      const perfil = await db.collection("users").doc(sesion.uid).get();
      if (!perfil.get("eliminando")) throw error;
      return sesion;
    });
    res.locals.uid = datos.uid;
    res.locals.correo = datos.email;
    next();
  } catch (error) {
    // Temporary diagnostic for Firebase token verification failures.
    const fallo = error as { code?: string; message?: string };
    console.error(
      "401 verifyIdToken falló. code:",
      fallo.code,
      "| mensaje:",
      fallo.message
    );
    res.status(401).json({
      success: false,
      message: "No autorizado: la sesión no es válida o expiró",
    });
  }
}

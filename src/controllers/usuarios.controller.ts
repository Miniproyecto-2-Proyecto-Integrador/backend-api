import { Request, Response } from "express";
import type { DatosPerfil } from "../services/usuarios.service";
import { actualizarPerfil, crearPerfil, obtenerPerfil } from "../services/usuarios.service";

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarPerfil(datos: Partial<DatosPerfil>) {
  const errores: Record<string, string> = {};

  if (datos.nombres !== undefined && (!datos.nombres || datos.nombres.length > 50)) {
    errores.nombres = "Escribe tus nombres (máximo 50 letras).";
  }
  if (datos.apellidos !== undefined && (!datos.apellidos || datos.apellidos.length > 50)) {
    errores.apellidos = "Escribe tus apellidos (máximo 50 letras).";
  }
  if (datos.username !== undefined && (!/^[a-zA-Z0-9_]{3,20}$/.test(datos.username))) {
    errores.username =
      "El nombre de usuario debe tener de 3 a 20 caracteres: letras, números o guion bajo.";
  }
  if (datos.avatar !== undefined && (!datos.avatar || datos.avatar.length > 300)) {
    errores.avatar = "Elige un avatar.";
  }

  return errores;
}

export async function crearUsuario(req: Request, res: Response) {
  const { nombres, apellidos, username, avatar } = req.body ?? {};

  const datos = {
    nombres: texto(nombres),
    apellidos: texto(apellidos),
    username: texto(username),
    avatar: texto(avatar),
    correo: res.locals.correo as string,
  };

  const errores = validarPerfil(datos);

  if (Object.keys(errores).length > 0) {
    res.status(400).json({
      success: false,
      message: "Revisa los datos del formulario.",
      errores,
    });
    return;
  }

  try {
    await crearPerfil(res.locals.uid, datos);
    res.status(201).json({
      success: true,
      message: "Perfil creado correctamente",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_OCUPADO") {
      res.status(409).json({
        success: false,
        message: "Ese nombre de usuario ya está en uso.",
        errores: { username: "Ese nombre de usuario ya está en uso. Prueba con otro." },
      });
      return;
    }

    if (error instanceof Error && error.message === "PERFIL_EXISTE") {
      res.status(409).json({
        success: false,
        message: "Este usuario ya tiene un perfil creado.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({
      success: false,
      message: "No pudimos crear tu perfil. Intenta de nuevo.",
    });
  }
}

export async function obtenerMiPerfil(_req: Request, res: Response) {
  try {
    const perfil = await obtenerPerfil(res.locals.uid);

    if (!perfil) {
      res.status(404).json({
        success: false,
        message: "Este usuario aún no tiene perfil.",
      });
      return;
    }

    res.status(200).json({ success: true, data: perfil });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "No pudimos cargar tu perfil. Intenta de nuevo.",
    });
  }
}
export async function editarMiPerfil(req: Request, res: Response) {
  const campos = ["nombres", "apellidos", "username", "avatar", "correo"] as const;
  const cuerpo: unknown = req.body;
  const cambios: Partial<DatosPerfil> = {};
  if (cuerpo && typeof cuerpo === "object" && !Array.isArray(cuerpo)) {
    for (const campo of campos) {
      if (Object.hasOwn(cuerpo, campo)) {
        cambios[campo] = texto((cuerpo as Record<string, unknown>)[campo]);
      }
    }
  }

  const errores = validarPerfil(cambios);
  if (cambios.correo !== undefined) {
    cambios.correo = cambios.correo.toLowerCase();
    if (cambios.correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cambios.correo)) {
      errores.correo = "Escribe un correo válido.";
    }
  }
  if (!Object.keys(cambios).length || Object.keys(errores).length) {
    res.status(400).json({ success: false, message: "Revisa los datos del formulario.", errores });
    return;
  }

  try {
    const data = await actualizarPerfil(res.locals.uid, cambios);
    res.json({ success: true, message: "Perfil actualizado correctamente.", data });
  } catch (error) {
    const codigo = (error as { code?: string }).code;
    const motivo = error instanceof Error ? error.message : "";
    if (motivo === "PERFIL_NO_EXISTE") {
      res.status(404).json({ success: false, message: "Este usuario aún no tiene perfil." });
      return;
    }
    if (motivo === "PERFIL_MODIFICADO") {
      res.status(409).json({ success: false, message: "Tu perfil cambió. Vuelve a cargarlo e intenta de nuevo." });
      return;
    }
    const campo = motivo === "USERNAME_OCUPADO" ? "username"
      : motivo === "CORREO_OCUPADO" || codigo === "auth/email-already-exists" ? "correo" : null;
    if (campo) {
      const message = campo === "correo" ? "Ese correo ya está en uso." : "Ese nombre de usuario ya está en uso.";
      res.status(409).json({ success: false, message, errores: { [campo]: message } });
      return;
    }
    if (codigo === "auth/invalid-email") {
      res.status(400).json({ success: false, message: "Escribe un correo válido." });
      return;
    }
    console.error("No se pudo actualizar el perfil", codigo ?? motivo.split(":")[0]);
    res.status(500).json({ success: false, message: "No pudimos actualizar tu perfil. Intenta de nuevo." });
  }
}

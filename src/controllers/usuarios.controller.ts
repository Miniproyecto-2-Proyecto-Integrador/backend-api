import { Request, Response } from "express";
import { crearPerfil, obtenerPerfil } from "../services/usuarios.service";

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
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

  const errores: Record<string, string> = {};

  if (!datos.nombres || datos.nombres.length > 50) {
    errores.nombres = "Escribe tus nombres (máximo 50 letras).";
  }
  if (!datos.apellidos || datos.apellidos.length > 50) {
    errores.apellidos = "Escribe tus apellidos (máximo 50 letras).";
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(datos.username)) {
    errores.username =
      "El nombre de usuario debe tener de 3 a 20 caracteres: letras, números o guion bajo.";
  }
  if (!datos.avatar || datos.avatar.length > 300) {
    errores.avatar = "Elige un avatar.";
  }

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
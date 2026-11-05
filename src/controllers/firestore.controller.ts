import { Request, Response } from "express";
import { obtenerPruebas } from "../services/firestore.service";

export const consultarPruebas = async (
  _req: Request,
  res: Response
) => {
  try {
    const documentos = await obtenerPruebas();

    res.status(200).json({
      success: true,
      data: documentos,
    });
  } catch (error) {
    console.error("Error al consultar Firestore:", error);

    res.status(500).json({
      success: false,
      message: "Error interno al consultar los datos.",
      details:
        error instanceof Error
          ? error.message
          : "Error desconocido",
    });
  }
};
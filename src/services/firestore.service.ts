import { db } from "../config/firebase";

export const obtenerPruebas = async () => {
  const snapshot = await db.collection("pruebas").get();

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
};

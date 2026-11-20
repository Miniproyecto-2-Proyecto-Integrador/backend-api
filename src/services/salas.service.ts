import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase";

export async function crearSala(uid: string, nombre: string) {
  // La transacción comprueba y reserva cada candidato de forma atómica.
  for (let intento = 0; intento < 5; intento += 1) {
    const sala = db.collection("rooms").doc(randomBytes(6).toString("base64url"));
    const creada = await db.runTransaction(async (t) => {
      const [perfil, existente] = await t.getAll(db.collection("users").doc(uid), sala);
      if (!perfil.exists || perfil.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
      if (existente.exists) return false;
      t.create(sala, { nombre, propietarioUid: uid, creadaEn: FieldValue.serverTimestamp() });
      return true;
    });
    if (creada) return { id: sala.id, nombre, rol: "administrador" };
  }
  throw new Error("No pudimos generar un ID de sala disponible.");
}

export async function listarSalasPropias(uid: string) {
  const salas = await db.collection("rooms").where("propietarioUid", "==", uid).get();
  return salas.docs.map((sala) => ({
    id: sala.id,
    nombre: sala.get("nombre") as string,
    rol: "administrador",
  }));
}

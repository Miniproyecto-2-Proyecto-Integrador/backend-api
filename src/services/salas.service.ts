import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase";

export async function crearSala(uid: string, nombre: string) {
  const sala = db.collection("rooms").doc();
  await db.runTransaction(async (t) => {
    const perfil = await t.get(db.collection("users").doc(uid));
    if (!perfil.exists || perfil.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
    t.create(sala, { nombre, propietarioUid: uid, creadaEn: FieldValue.serverTimestamp() });
  });
  return { id: sala.id, nombre, rol: "administrador" };
}

export async function listarSalasPropias(uid: string) {
  const salas = await db.collection("rooms").where("propietarioUid", "==", uid).get();
  return salas.docs.map((sala) => ({
    id: sala.id,
    nombre: sala.get("nombre") as string,
    rol: "administrador",
  }));
}

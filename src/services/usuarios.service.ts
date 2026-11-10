import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase";

export type DatosPerfil = {
  nombres: string;
  apellidos: string;
  username: string;
  avatar: string;
  correo: string;
};

export async function crearPerfil(uid: string, datos: DatosPerfil) {
  const usuarioRef = db.collection("users").doc(uid);
  const usernameRef = db
    .collection("usernames")
    .doc(datos.username.toLowerCase());

  // La transacción garantiza que dos personas no tomen el mismo usuario
  await db.runTransaction(async (t) => {
    const perfil = await t.get(usuarioRef);
    if (perfil.exists) {
      throw new Error("PERFIL_EXISTE");
    }

    const nombre = await t.get(usernameRef);
    if (nombre.exists) {
      throw new Error("USERNAME_OCUPADO");
    }

    t.set(usernameRef, { uid });
    t.set(usuarioRef, { ...datos, creadoEn: FieldValue.serverTimestamp() });
  });
}
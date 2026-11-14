import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "../config/firebase";

export async function eliminarCuenta(uid: string) {
  const perfilRef = db.collection("users").doc(uid);
  await db.runTransaction(async (t) => {
    const perfil = await t.get(perfilRef);
    if (perfil.exists) t.update(perfilRef, { eliminando: true });
  });

  const salasPropias = await db.collection("rooms").where("propietarioUid", "==", uid).get();
  for (const sala of salasPropias.docs) {
    await db.runTransaction(async (t) => {
      if ((await t.get(sala.ref)).exists) t.update(sala.ref, { eliminando: true });
    });
    // El documento de la sala permite localizar el chat si hay que reintentar.
    await db.recursiveDelete(sala.ref.collection("messages"));
    await sala.ref.delete();
  }

  while (true) {
    const mensajes = await db.collectionGroup("messages").where("autorUid", "==", uid).limit(400).get();
    if (mensajes.empty) break;
    const escritor = db.bulkWriter();
    const cambios = mensajes.docs.map((mensaje) => escritor.update(mensaje.ref, {
      autorUid: FieldValue.delete(),
      autor: "Cuenta eliminada",
    }).catch((error) => {
      // La sala pudo eliminarse al mismo tiempo que esta cuenta.
      if (error.code !== 5) throw error;
    }));
    await Promise.all([escritor.close(), ...cambios]);
  }

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
  }

  await db.runTransaction(async (t) => {
    const perfil = await t.get(perfilRef);
    if (!perfil.exists) return;
    const usernameRef = db.collection("usernames").doc((perfil.get("username") as string).toLowerCase());
    const reserva = await t.get(usernameRef);
    if (reserva.get("uid") === uid) t.delete(usernameRef);
    t.delete(perfilRef);
  });
}

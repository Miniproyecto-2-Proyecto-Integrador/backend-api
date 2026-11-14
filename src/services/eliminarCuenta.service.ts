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
    // Keep the room document until its messages are gone so a retry can find it.
    await db.recursiveDelete(sala.ref.collection("messages"));
    await sala.ref.delete();
  }

  while (true) {
    const mensajes = await db.collectionGroup("messages").where("autorUid", "==", uid).limit(400).get();
    if (mensajes.empty) break;
    const lote = db.batch();
    for (const mensaje of mensajes.docs) {
      lote.update(mensaje.ref, { autorUid: FieldValue.delete(), autor: "Cuenta eliminada" });
    }
    await lote.commit();
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

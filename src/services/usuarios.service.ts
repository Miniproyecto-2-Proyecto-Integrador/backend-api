import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "../config/firebase";

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

export async function obtenerPerfil(uid: string) {
  const doc = await db.collection("users").doc(uid).get();

  if (!doc.exists) {
    return null;
  }

  const datos = doc.data();
  return { ...datos, creadoEn: datos?.creadoEn?.toDate() };
}

export async function actualizarPerfil(uid: string, cambios: Partial<DatosPerfil>) {
  const usuarioRef = db.collection("users").doc(uid);
  const usernames = db.collection("usernames");
  const correo = cambios.correo;

  if (correo) {
    const coincidencias = await db.collection("users").where("correo", "==", correo).get();
    if (coincidencias.docs.some((doc) => doc.id !== uid)) {
      throw new Error("CORREO_OCUPADO");
    }
  }

  const previo = await usuarioRef.get();
  if (!previo.exists || previo.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
  const cuenta = correo ? await auth.getUser(uid) : undefined;
  const cambiarCorreo = correo !== undefined && cuenta?.email !== correo;
  let correoActualizado = false;
  try {
    if (cambiarCorreo) {
      await auth.updateUser(uid, { email: correo, emailVerified: false });
      correoActualizado = true;
    }

    return await db.runTransaction(async (t) => {
      const perfil = await t.get(usuarioRef);
      if (!perfil.exists || perfil.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
      const anterior = (perfil.get("username") as string).toLowerCase();
      const siguiente = cambios.username?.toLowerCase() ?? anterior;
      if (siguiente !== anterior) {
        const anteriorRef = usernames.doc(anterior);
        const siguienteRef = usernames.doc(siguiente);
        const [reservaAnterior, reservaSiguiente] = await t.getAll(anteriorRef, siguienteRef);
        if (reservaSiguiente.exists && reservaSiguiente.get("uid") !== uid) {
          throw new Error("USERNAME_OCUPADO");
        }
        t.set(siguienteRef, { uid });
        if (reservaAnterior.get("uid") === uid) t.delete(anteriorRef);
      }

      t.update(usuarioRef, cambios);
      const data = perfil.data();
      return { ...data, ...cambios, creadoEn: data?.creadoEn?.toDate() };
    });
  } catch (error) {
    if (correoActualizado && cuenta?.email && (await auth.getUser(uid)).email === correo) {
      await auth.updateUser(uid, { email: cuenta.email, emailVerified: cuenta.emailVerified });
    }
    throw error;
  }
}

import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase";

// Mismo formato que valida el servidor de tiempo real: IDs nuevos de 8
// caracteres URL-safe e IDs existentes alfanuméricos de 20 caracteres.
export function esIdSalaValido(id: unknown): id is string {
  return typeof id === "string" && /^(?:[A-Za-z0-9_-]{8}|[A-Za-z0-9]{20})$/.test(id);
}

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

export async function obtenerSala(uid: string, id: string) {
  const [sala, perfil] = await db.getAll(db.collection("rooms").doc(id), db.collection("users").doc(uid));
  if (!perfil.exists || perfil.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
  if (!sala.exists || sala.get("eliminando")) return null;
  return {
    id: sala.id,
    nombre: sala.get("nombre") as string,
    rol: sala.get("propietarioUid") === uid ? "administrador" : "participante",
  };
}

// Comprueba en una transacción que la sala existe y que quien consulta es el
// anfitrión. Los errores se traducen a 404 y 403 en la ruta.
async function validarAnfitrion(
  t: FirebaseFirestore.Transaction,
  uid: string,
  id: string,
  permitirEnEliminacion: boolean,
) {
  const salaRef = db.collection("rooms").doc(id);
  const [sala, perfil] = await t.getAll(salaRef, db.collection("users").doc(uid));
  if (!perfil.exists || perfil.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
  if (!sala.exists || (sala.get("eliminando") && !permitirEnEliminacion)) throw new Error("SALA_NO_EXISTE");
  if (sala.get("propietarioUid") !== uid) throw new Error("SIN_PERMISO");
  return salaRef;
}

export async function actualizarSala(uid: string, id: string, nombre: string) {
  await db.runTransaction(async (t) => {
    const salaRef = await validarAnfitrion(t, uid, id, false);
    t.update(salaRef, { nombre });
  });
  return { id, nombre, rol: "administrador" };
}

export async function eliminarSala(uid: string, id: string) {
  // Marca la sala como «eliminando» para que nadie más entre mientras se borra.
  // Si un intento anterior se interrumpió, el anfitrión puede repetirlo.
  const salaRef = await db.runTransaction(async (t) => {
    const ref = await validarAnfitrion(t, uid, id, true);
    t.update(ref, { eliminando: true });
    return ref;
  });
  await db.recursiveDelete(salaRef.collection("messages"));
  await salaRef.delete();
}
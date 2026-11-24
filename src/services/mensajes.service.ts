import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";

export const LIMITE_MENSAJES = 50;

export type CursorMensajes = { segundos: number; nanos: number; id: string };

// El cursor es «segundos_nanosegundos_idMensaje», el mensaje más antiguo de la
// página anterior. Devuelve null si el texto no tiene ese formato.
export function leerCursor(valor: unknown): CursorMensajes | null {
  if (typeof valor !== "string") return null;
  const partes = /^(\d{1,12})_(\d{1,9})_([A-Za-z0-9]{1,40})$/.exec(valor);
  if (!partes) return null;
  return { segundos: Number(partes[1]), nanos: Number(partes[2]), id: partes[3] };
}

export async function listarMensajes(uid: string, salaId: string, limite: number, antes?: CursorMensajes) {
  const salaRef = db.collection("rooms").doc(salaId);
  const [sala, perfil] = await db.getAll(salaRef, db.collection("users").doc(uid));
  if (!perfil.exists || perfil.get("eliminando")) throw new Error("PERFIL_NO_EXISTE");
  if (!sala.exists || sala.get("eliminando")) throw new Error("SALA_NO_EXISTE");

  // Del más reciente al más antiguo; se pide uno de más para saber si hay más.
  let consulta: FirebaseFirestore.Query = salaRef
    .collection("messages")
    .orderBy("creadoEn", "desc")
    .orderBy(FieldPath.documentId(), "desc");
  if (antes) consulta = consulta.startAfter(new Timestamp(antes.segundos, antes.nanos), antes.id);
  const docs = (await consulta.limit(limite + 1).get()).docs;

  const hayMas = docs.length > limite;
  const pagina = docs.slice(0, limite).reverse(); // orden cronológico
  const mensajes = pagina.map((mensaje) => ({
    id: mensaje.id,
    salaId,
    autor: mensaje.get("autor") as string,
    texto: mensaje.get("texto") as string,
    creadoEn: (mensaje.get("creadoEn") as Timestamp).toDate().toISOString(),
    esPropio: mensaje.get("autorUid") === uid,
  }));

  const masAntiguo = pagina[0];
  const marca = masAntiguo?.get("creadoEn") as Timestamp | undefined;
  const siguienteCursor =
    hayMas && masAntiguo && marca ? `${marca.seconds}_${marca.nanoseconds}_${masAntiguo.id}` : null;
  return { mensajes, hayMas, siguienteCursor };
}
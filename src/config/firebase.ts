import {
  initializeApp,
  applicationDefault,
  getApps,
} from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("Falta configurar FIREBASE_PROJECT_ID");
}

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId,
      });

export const db = getFirestore(firebaseApp);
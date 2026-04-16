import { config } from "../config.js";

let firestoreDbPromise = null;

function readCredentialConfig() {
  const projectId = String(config.firestoreProjectId || "").trim();
  const clientEmail = String(process.env.FIRESTORE_CLIENT_EMAIL || "").trim();
  const privateKeyRaw = String(process.env.FIRESTORE_PRIVATE_KEY || "").trim();
  const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : "";

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

async function initializeFirestoreDb() {
  const appModule = await import("firebase-admin/app");
  const firestoreModule = await import("firebase-admin/firestore");

  const { getApps, initializeApp, cert } = appModule;
  const { getFirestore } = firestoreModule;

  if (getApps().length === 0) {
    const credentials = readCredentialConfig();
    const hasStaticCredentials = credentials.projectId && credentials.clientEmail && credentials.privateKey;

    if (hasStaticCredentials) {
      initializeApp({
        credential: cert({
          projectId: credentials.projectId,
          clientEmail: credentials.clientEmail,
          privateKey: credentials.privateKey
        }),
        projectId: credentials.projectId
      });
    } else if (credentials.projectId) {
      // Prefer ADC in Cloud Run, while keeping explicit project id for local/dev tooling.
      initializeApp({ projectId: credentials.projectId });
    } else {
      initializeApp();
    }
  }

  return getFirestore();
}

export async function getFirestoreDb() {
  if (!firestoreDbPromise) {
    firestoreDbPromise = initializeFirestoreDb();
  }
  return firestoreDbPromise;
}

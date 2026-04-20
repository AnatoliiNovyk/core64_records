import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

let firestoreDbPromise = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

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

function listLikelyServiceAccountFiles(projectId) {
  const normalizedProjectId = String(projectId || "").trim().toLowerCase();
  try {
    const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => {
        if (!fileName.toLowerCase().endsWith(".json")) return false;
        if (/service-account|firebase-adminsdk/i.test(fileName)) return true;
        if (normalizedProjectId && fileName.toLowerCase().startsWith(`${normalizedProjectId}-`)) return true;
        return false;
      })
      .map((fileName) => path.resolve(repoRoot, fileName));
  } catch (_error) {
    return [];
  }
}

function readServiceAccountCredentialFromFile(filePath, expectedProjectId) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const projectId = String(parsed?.project_id || "").trim();
    const clientEmail = String(parsed?.client_email || "").trim();
    const privateKey = String(parsed?.private_key || "").trim();
    const type = String(parsed?.type || "").trim().toLowerCase();

    if (type !== "service_account") return null;
    if (!projectId || !clientEmail || !privateKey) return null;
    if (expectedProjectId && projectId !== expectedProjectId) return null;

    return {
      projectId,
      clientEmail,
      privateKey
    };
  } catch (_error) {
    return null;
  }
}

function readLocalCredentialFileFallback(projectId) {
  const isProduction = String(config.nodeEnv || "").trim().toLowerCase() === "production";
  const hasExplicitCredentialPath = String(process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim().length > 0;
  if (isProduction || hasExplicitCredentialPath) return null;

  const candidateFiles = listLikelyServiceAccountFiles(projectId);
  for (const filePath of candidateFiles) {
    const credential = readServiceAccountCredentialFromFile(filePath, projectId);
    if (credential) {
      return credential;
    }
  }

  return null;
}

async function initializeFirestoreDb() {
  const appModule = await import("firebase-admin/app");
  const firestoreModule = await import("firebase-admin/firestore");

  const { getApps, initializeApp, cert } = appModule;
  const { getFirestore } = firestoreModule;

  if (getApps().length === 0) {
    const credentials = readCredentialConfig();
    const hasStaticCredentials = credentials.projectId && credentials.clientEmail && credentials.privateKey;
    const localFileCredential = hasStaticCredentials ? null : readLocalCredentialFileFallback(credentials.projectId);

    if (hasStaticCredentials) {
      initializeApp({
        credential: cert({
          projectId: credentials.projectId,
          clientEmail: credentials.clientEmail,
          privateKey: credentials.privateKey
        }),
        projectId: credentials.projectId
      });
    } else if (localFileCredential) {
      initializeApp({
        credential: cert({
          projectId: localFileCredential.projectId,
          clientEmail: localFileCredential.clientEmail,
          privateKey: localFileCredential.privateKey
        }),
        projectId: localFileCredential.projectId
      });
    } else if (credentials.projectId) {
      // Prefer ADC in Cloud Run, while keeping explicit project id for local/dev tooling.
      initializeApp({ projectId: credentials.projectId });
    } else {
      initializeApp();
    }
  }

  const databaseId = String(config.firestoreDatabaseId || "(default)").trim();
  return databaseId && databaseId !== "(default)" ? getFirestore(getApps()[0], databaseId) : getFirestore();
}

export async function getFirestoreDb() {
  if (!firestoreDbPromise) {
    firestoreDbPromise = initializeFirestoreDb();
  }
  return firestoreDbPromise;
}

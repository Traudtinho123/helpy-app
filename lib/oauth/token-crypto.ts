import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function isLikelyPlainOAuthToken(payload: string): boolean {
  const trimmed = payload.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("eyJ")) return true;
  if (trimmed.startsWith("ya29.")) return true;
  if (trimmed.startsWith("1//")) return true;
  if (trimmed.startsWith("0.")) return true;
  if (!trimmed.includes(".")) return true;
  return false;
}

function resolveEncryptionKey(): Buffer {
  const raw =
    process.env.HELPY_OAUTH_ENCRYPTION_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "helpy-dev-oauth-key-not-for-production";

  return createHash("sha256").update(raw).digest();
}

/** Verschlüsselt OAuth-Tokens für DB-Speicherung (AES-256-GCM). */
export function encryptOAuthSecret(plaintext: string): string {
  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/** Entschlüsselt OAuth-Tokens aus der DB. Plaintext/JWT-Fallback für Legacy-Einträge. */
export function decryptOAuthSecret(payload: string): string {
  const trimmed = payload.trim();
  if (!trimmed || isLikelyPlainOAuthToken(trimmed)) {
    return trimmed;
  }

  const [ivPart, tagPart, dataPart] = trimmed.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    return trimmed;
  }

  try {
    const key = resolveEncryptionKey();
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivPart, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return trimmed;
  }
}

export function isOAuthEncryptionConfigured(): boolean {
  return Boolean(
    process.env.HELPY_OAUTH_ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

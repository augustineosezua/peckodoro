import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  randomBytes,
  randomUUID,
  sign,
} from "crypto";
import { prisma } from "@/app/lib/prisma";

// Tokens last a week; a new one is signed once the cached one has a day left
const LIFETIME_S = 7 * 24 * 60 * 60;
const RENEW_BEFORE_MS = 24 * 60 * 60 * 1000;

let cached = null; // { token, expiresAt }

// The .p8 key, however it was pasted: on one line with literal \n (as in .env),
// with real line breaks, or still wrapped in the quotes from .env (Vercel keeps
// quotes as part of the value)
const privateKeyPem = () =>
  (process.env.APPLE_MUSIC_PRIVATE_KEY || "")
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, "$2")
    .replace(/\\n/g, "\n")
    .trim();

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

// Signs an Apple Music developer token (ES256 JWT) from the MusicKit key in the env
export function getDeveloperToken() {
  if (cached && cached.expiresAt - Date.now() > RENEW_BEFORE_MS) return cached;

  const { APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID } = process.env;
  const missing = ["APPLE_MUSIC_TEAM_ID", "APPLE_MUSIC_KEY_ID", "APPLE_MUSIC_PRIVATE_KEY"].filter(
    (name) => !process.env[name]
  );
  if (missing.length) {
    throw new Error(`Apple Music env vars missing: ${missing.join(", ")}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    base64url({ alg: "ES256", kid: APPLE_MUSIC_KEY_ID }) +
    "." +
    base64url({ iss: APPLE_MUSIC_TEAM_ID, iat: now, exp: now + LIFETIME_S });
  let key;
  try {
    key = createPrivateKey(privateKeyPem());
  } catch (err) {
    throw new Error(`APPLE_MUSIC_PRIVATE_KEY isn't a readable .p8 key: ${err.message}`);
  }
  const signature = sign("sha256", Buffer.from(unsigned), {
    key,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");

  cached = { token: `${unsigned}.${signature}`, expiresAt: (now + LIFETIME_S) * 1000 };
  return cached;
}

// ---- Users' Apple Music sign-ins ----
// Kept in the account table (providerId "apple-music") so the sign-in follows
// the Peckodoro account, not the browser. Encrypted with APPLE_MUSIC_TOKEN_KEY;
// changing that key means users reconnect Apple Music once.
const PROVIDER = "apple-music";

function tokenKey() {
  const key = Buffer.from(process.env.APPLE_MUSIC_TOKEN_KEY || "", "hex");
  if (key.length !== 32) {
    throw new Error("APPLE_MUSIC_TOKEN_KEY must be 32 bytes of hex");
  }
  return key;
}

function encryptToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function decryptToken(stored) {
  try {
    const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", tokenKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export async function getUserToken(userId) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: PROVIDER },
  });
  return account?.accessToken ? decryptToken(account.accessToken) : null;
}

export async function saveUserToken(userId, token) {
  const accessToken = encryptToken(token);
  const now = new Date();
  const existing = await prisma.account.findFirst({
    where: { userId, providerId: PROVIDER },
  });
  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { accessToken, updatedAt: now },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: PROVIDER,
        userId,
        accessToken,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

export async function deleteUserToken(userId) {
  await prisma.account.deleteMany({ where: { userId, providerId: PROVIDER } });
}

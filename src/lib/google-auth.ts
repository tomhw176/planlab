import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Persist tokens to a file so they survive dev server hot-reloads
const TOKEN_FILE = path.join(process.cwd(), ".google-tokens.json");

interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

function readTokens(): StoredTokens | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = fs.readFileSync(TOKEN_FILE, "utf-8");
      return JSON.parse(data) as StoredTokens;
    }
  } catch {
    // File corrupt or missing — treat as no tokens
  }
  return null;
}

function writeTokens(tokens: StoredTokens | null) {
  try {
    if (tokens) {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    } else {
      if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
    }
  } catch {
    // Non-fatal
  }
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(returnTo?: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/drive.file",
    ],
    state: returnTo || "",
  });
}

export async function handleCallback(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  const stored: StoredTokens = {
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
  };
  writeTokens(stored);
  client.setCredentials(tokens);
  return client;
}

export function getAuthedClient() {
  const tokens = readTokens();
  if (!tokens?.access_token) return null;
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

export function isAuthenticated(): boolean {
  const tokens = readTokens();
  return !!tokens?.access_token;
}

export function clearTokens() {
  writeTokens(null);
}

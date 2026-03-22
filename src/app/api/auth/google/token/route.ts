import { getAuthedClient, isAuthenticated } from "@/lib/google-auth";

// GET /api/auth/google/token — returns access token for client-side Picker
export async function GET() {
  if (!isAuthenticated()) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const client = getAuthedClient();
  if (!client) {
    return Response.json({ error: "No auth client" }, { status: 401 });
  }

  const credentials = client.credentials;
  if (!credentials?.access_token) {
    return Response.json({ error: "No access token" }, { status: 401 });
  }

  return Response.json({ accessToken: credentials.access_token });
}

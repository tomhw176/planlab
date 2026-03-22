import { getAuthUrl, isAuthenticated } from "@/lib/google-auth";

// GET /api/auth/google — returns auth URL or auth status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Check auth status
  if (action === "status") {
    return Response.json({ authenticated: isAuthenticated() });
  }

  // Generate auth URL
  const returnTo = searchParams.get("returnTo") || "";
  const url = getAuthUrl(returnTo);
  return Response.json({ url });
}

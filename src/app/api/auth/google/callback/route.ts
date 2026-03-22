import { handleCallback } from "@/lib/google-auth";

// GET /api/auth/google/callback — handles OAuth redirect
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  try {
    await handleCallback(code);

    // Redirect back to the app (state contains the returnTo path)
    const redirectUrl = state || "/";
    return Response.redirect(new URL(redirectUrl, request.url).origin + redirectUrl, 302);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return new Response("Authentication failed. Please try again.", { status: 500 });
  }
}

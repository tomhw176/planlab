import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Get the Anthropic API key, working around the issue where
 * Claude Code desktop app sets ANTHROPIC_API_KEY="" in the environment,
 * which prevents Next.js from loading the real key from .env
 */
function getApiKey(): string {
  // First try the environment variable
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey;
  }

  // Fall back to reading .env file directly — check multiple locations
  const possiblePaths = [
    join(process.cwd(), ".env"),
    join(__dirname, "..", "..", ".env"),
    "C:\\Dev\\planlab\\.env",
  ];

  for (const envPath of possiblePaths) {
    try {
      const envContent = readFileSync(envPath, "utf-8");
      const match = envContent.match(/^ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?/m);
      if (match && match[1].trim().length > 0) {
        return match[1].trim();
      }
    } catch {
      // Try next path
    }
  }

  throw new Error("ANTHROPIC_API_KEY is not configured");
}

/**
 * Create an Anthropic client with the API key properly resolved.
 */
export function createAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKey() });
}

import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { readFileSync } from "fs";

// Manually parse .env.local and inject into process.env
function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const content = readFileSync(resolve(__dirname, ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  } catch {
    // .env.local not found — tests will fail gracefully with a clear error
  }
  return env;
}

const envLocal = loadEnvLocal();

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    env: envLocal,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

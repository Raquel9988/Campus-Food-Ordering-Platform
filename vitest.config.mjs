import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const supabaseMockPath = path.resolve(
  currentDir,
  "tests/mocks/supabaseMock.js"
);

function supabaseCdnMockPlugin() {
  return {
    name: "supabase-cdn-mock-plugin",
    enforce: "pre",

    resolveId(source) {
      if (
        source.startsWith(
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js"
        ) ||
        source.startsWith("https://esm.sh/@supabase/supabase-js")
      ) {
        return supabaseMockPath;
      }

      return null;
    },
  };
}

export default defineConfig({
  plugins: [supabaseCdnMockPlugin()],

  test: {
    environment: "jsdom",
    globals: true,
    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },

  resolve: {
    alias: [
      {
        find: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm",
        replacement: supabaseMockPath,
      },
      {
        find: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js.*$/,
        replacement: supabaseMockPath,
      },
      {
        find: /^https:\/\/esm\.sh\/@supabase\/supabase-js.*$/,
        replacement: supabaseMockPath,
      },
    ],
  },
});
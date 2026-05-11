import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const supabaseMockPath = path.resolve(
  currentDir,
  "tests/mocks/supabaseMock.js"
);

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
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
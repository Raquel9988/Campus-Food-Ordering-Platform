import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export default defineConfig({
  test: {
    environment: "jsdom",
  },

  resolve: {
    alias: {
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm": path.resolve(
        currentDir,
        "tests/mocks/supabaseMock.js"
      ),
    },
  },
});
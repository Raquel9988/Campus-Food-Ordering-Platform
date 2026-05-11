import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2025-01-01",
      },
    }),
  ],

  test: {
    globals: true,

    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],

      include: [
        "functions/**/*.js",
        "payments/**/*.js",
        "student/**/*.js",
        "vendor/**/*.js",
        "dietary/**/*.js"
      ],

      exclude: [
        "tests/**",
        "**/*.test.js",
        "**/*.spec.js",
        "coverage/**",
        "node_modules/**"
      ],
    },
  },
});
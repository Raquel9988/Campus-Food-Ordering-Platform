import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["coverage/"]
  },

  js.configs.recommended,

  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      }
    }
  }
];
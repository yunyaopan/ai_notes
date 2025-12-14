import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore generated build and coverage folders (these produce generated files that
  // should not be linted). This prevents ESLint from reporting errors coming from
  // `.next` and `.open-next` generated type files after upgrading Next.
  {
    ignores: [
      "**/.next/**",
      "**/.open-next/**",
      "coverage/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      // Test and e2e folders should not be linted by project-wide ESLint runs
      "**/__tests__/**",
      "**/__test__/**",
      "e2e/**",
    ],
  },
  // Relax some rules for test and config files where `any` and `require()` are common.
  {
    files: ["**/__tests__/**", "**/*.test.*", "jest.config.js", "e2e/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;

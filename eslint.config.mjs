import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Generated output must never be linted (it only exists after a build).
  { ignores: [".next/**", "out/**", "build/**", "coverage/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;

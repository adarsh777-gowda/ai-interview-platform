import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // prisma/ holds real source too (the seed + question bank), so its tests
    // must be discovered alongside the ones under src/.
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
  },
});

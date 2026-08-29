import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@milc/shared": path.resolve(__dirname, "./shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["shared/**/*.test.ts", "backend/**/*.test.ts"],
  },
});

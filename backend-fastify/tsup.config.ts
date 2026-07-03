import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  clean: true,
  format: "esm",
  sourcemap: true,
  cjsInterop: true,
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});

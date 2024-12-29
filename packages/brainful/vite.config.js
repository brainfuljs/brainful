/// <reference types="vitest/config" />
import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/core"],
    },
  },

  build: {
    lib: {
      entry: resolve(__dirname, "lib/brainful.ts"),
      name: "brainful",
      fileName: "brainful",
    },
    rollupOptions: {
      external: [
        "inversify",
        "rxjs",
        "immutable",
        "reflect-metadata",
        "ramda",
        "nanoid",
      ],
      output: [
        {
          dir: "dist/lib/esm",
          format: "es",
        },

        {
          dir: "dist/lib/node",
          format: "cjs",
        },
      ],
    },
    minify: false,
  },

  plugins: [
    dts({
      outDir: resolve(__dirname, "dist", "types"),
      include: ["lib"],
      exclude: ["lib/__tests__"],
      tsconfigPath: "./tsconfig.json",
    }),
  ],
})

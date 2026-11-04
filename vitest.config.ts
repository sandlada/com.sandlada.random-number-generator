/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag: string) => tag.startsWith("md-"),
                },
            },
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "happy-dom",
        include: ["src/**/*.test.ts"],
        setupFiles: ["src/test/setup.ts"],
    },
})

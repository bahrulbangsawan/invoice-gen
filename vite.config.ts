import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    ...(process.env.VITEST
      ? []
      : [
          cloudflare({
            viteEnvironment: { name: "ssr" },
            inspectorPort: false,
          }),
        ]),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-router",
              test: /node_modules[/\\]@tanstack[/\\](?:react-router|react-start)/,
            },
            {
              name: "vendor-icons",
              test: /node_modules[/\\]lucide-react/,
            },
          ],
        },
      },
    },
  },
});

export default config;

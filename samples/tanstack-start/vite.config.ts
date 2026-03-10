import msal from "@intility/vite-plugin-msal";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        spa: { enabled: true },
      }),
      msal({
        authority: `https://login.microsoftonline.com/${env.VITE_MSAL_TENANT_ID ?? "common"}`,
      }),
      viteReact(),
    ],
    server: {
      port: 3002,
      open: true,
    },
    preview: {
      port: 3002,
    },
  };
});

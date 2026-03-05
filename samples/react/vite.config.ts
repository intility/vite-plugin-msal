import msal from "@intility/vite-plugin-msal";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      react(),
      msal({
        authority: `https://login.microsoftonline.com/${env.VITE_MSAL_TENANT_ID ?? "common"}`,
      }),
    ],
    server: {
      port: 3000,
      open: true,
    },
    preview: {
      port: 3000,
    },
  };
});

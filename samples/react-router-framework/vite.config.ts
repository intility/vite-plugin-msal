import msal from "@intility/vite-plugin-msal";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      reactRouter(),
      msal({
        authority: `https://login.microsoftonline.com/${env.VITE_MSAL_TENANT_ID ?? "common"}`,
      }),
    ],
    server: {
      port: 3001,
      open: true,
    },
    preview: {
      port: 3001,
    },
  };
});

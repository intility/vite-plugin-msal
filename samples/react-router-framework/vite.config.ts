import msal from "@intility/vite-plugin-msal";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      reactRouter(),
      msal({
        authority: `https://login.microsoftonline.com/${env.VITE_MSAL_TENANT_ID ?? "common"}`,
      }),
      tsconfigPaths(),
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

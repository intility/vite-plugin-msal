import { LogLevel } from "@azure/msal-browser";
import { withMetadata } from "@intility/vite-plugin-msal/client";

export const config = withMetadata({
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID ?? "common"}`,
    redirectUri: "/redirect",
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Trace,
      loggerCallback: console.log,
    },
  },
});

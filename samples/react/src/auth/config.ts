import { type Configuration, LogLevel } from "@azure/msal-browser";

export const config: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID ?? "common"}`,
    redirectUri: `${window.location.origin}/redirect`,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Trace,
      loggerCallback: console.log,
    },
  },
};

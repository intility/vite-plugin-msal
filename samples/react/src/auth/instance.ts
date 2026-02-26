import { PublicClientApplication } from "@azure/msal-browser";

export const instance = new PublicClientApplication({
	auth: {
		clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID ?? "common"}`,
		redirectUri: `${window.location.origin}/redirect`,
	},
});

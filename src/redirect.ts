import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

broadcastResponseToMainFrame().catch((e) =>
	console.error("Redirect broadcast error:", e),
);

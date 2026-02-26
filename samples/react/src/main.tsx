import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { InteractionType } from "@azure/msal-browser";
import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
import App from "./App.tsx";
import { instance } from "./auth/instance.ts";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<MsalProvider instance={instance}>
			<MsalAuthenticationTemplate interactionType={InteractionType.Popup}>
				<App />
			</MsalAuthenticationTemplate>
		</MsalProvider>
	</StrictMode>,
);

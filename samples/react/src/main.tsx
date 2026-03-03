import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { InteractionType } from "@azure/msal-browser";
import {
	type MsalAuthenticationResult,
	MsalAuthenticationTemplate,
	MsalProvider,
} from "@azure/msal-react";
import App from "./App.tsx";
import { instance } from "./auth/instance.ts";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw Error("Root element not found");
}

function MsalError(props: MsalAuthenticationResult) {
	console.log(props);
	return <h1>big error</h1>;
}

function MsalLoading() {
	return <h1>loading</h1>;
}

const root = createRoot(rootElement);

root.render(
	<StrictMode>
		<MsalProvider instance={instance}>
			<MsalAuthenticationTemplate
				interactionType={InteractionType.Silent}
				authenticationRequest={{}}
				errorComponent={MsalError}
				loadingComponent={MsalLoading}
			>
				<App />
			</MsalAuthenticationTemplate>
		</MsalProvider>
	</StrictMode>,
);

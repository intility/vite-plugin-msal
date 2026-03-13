import { InteractionType } from "@azure/msal-browser";
import type { MsalAuthenticationResult } from "@azure/msal-react";
import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
import { Outlet } from "@tanstack/react-router";
import { getInstance } from "./instance";

function MsalError(props: MsalAuthenticationResult) {
  console.log(props);
  return <h1>Authentication error</h1>;
}

function MsalLoading() {
  return <h1>Loading...</h1>;
}

export default function MsalRoot() {
  return (
    <MsalProvider instance={getInstance()}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Silent}
        authenticationRequest={{}}
        errorComponent={MsalError}
        loadingComponent={MsalLoading}
      >
        <Outlet />
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
}

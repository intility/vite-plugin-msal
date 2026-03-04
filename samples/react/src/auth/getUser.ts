import type { IPublicClientApplication } from "@azure/msal-browser";

type GraphUser = {
  id: string;
  businessPhones: string[];
  displayName: string;
  givenName: string;
  jobTitle: string;
  mail: string;
  mobilePhone: string;
  officeLocation: string;
  preferredLanguage: string;
  surname: string;
  userPrincipalName: string;
};

export async function getUser(instance: IPublicClientApplication) {
  const token = await instance.acquireTokenSilent({
    scopes: ["user.read"],
  });

  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return (await response.json()) as GraphUser;
}

import { PublicClientApplication } from "@azure/msal-browser";
import { config } from "./config.client";

export const instance = new PublicClientApplication(config);

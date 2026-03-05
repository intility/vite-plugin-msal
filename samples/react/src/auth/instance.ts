import { PublicClientApplication } from "@azure/msal-browser";
import { config } from "./config";

export const instance = new PublicClientApplication(config);

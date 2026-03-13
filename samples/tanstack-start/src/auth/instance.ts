import { PublicClientApplication } from "@azure/msal-browser";
import { config } from "./config";

let _instance: PublicClientApplication | undefined;

export function getInstance() {
  if (!_instance) {
    _instance = new PublicClientApplication(config);
  }
  return _instance;
}

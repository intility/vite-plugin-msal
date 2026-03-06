# @intility/vite-plugin-msal

Vite plugin for `@azure/msal-browser` features.

## Usage

First, install the package:

```bash
npm install @intility/vite-plugin-msal
```

Then, set up the plugin in your `vite.config.ts`:

```ts
import msal from "@intility/vite-plugin-msal";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    msal({
      // optional - defaults to `/redirect`
      redirectBridgePath: "/redirect",
      // optional - defaults to undefined
      // if defined: fetches authority metadata for the client during build
      authority: "https://login.microsoftonline.com/common"
    }),
  ]
});
```

Optional: Use the `withMetadata` function to enable the metadata resolution bypassing feature:

```ts
import { withMetadata } from "@intility/vite-plugin-msal/client";
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = withMetadata({
  auth: {
    clientId: "",
    // must match the authority passed to the plugin
    authority: ""
  }
})

const instance = new PublicClientApplication(msalConfig);
```

## Features

### Redirect Bridge

This plugin automatically emits a redirect bridge described in [Login User / RedirectUri Considerations](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#redirecturi-considerations) and the [v4 -> v5 Migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md#cross-origin-opener-policy-coop-support), which is bundled with vite and your installed version of `@azure/msal-browser`.

If you haven't had a redirect bridge earlier, remember to update your redirect URIs in Entra ID.

The path of the redirect page can be configured with `redirectBridgePath`.

### Cross-Origin-Opener-Policy header

On the dev and preview server, return Cross-Origin-Opener-Policy header for all pages, except the redirect bridge.

Note that the plugin can only configure correct behavior for the dev and preview server. It is your responsibility to ensure your deployments returns the header in the correct scenarios.

### Bypass metadata resolution

This plugin adds automatic support for bypassing metadata resolution, described in the [`msal-common` Performance docs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/performance.md).

It does so by fetching the metadata during the vite `build` or `dev` startup, and injecting it into the bundle when calling `withMetadata(config)`.

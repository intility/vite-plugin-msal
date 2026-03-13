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
  plugins: [msal()],
});
```

## Features

### Redirect Bridge

This plugin automatically emits a redirect bridge described in [Login User / RedirectUri Considerations](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#redirecturi-considerations) and the [v4 -> v5 Migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md#cross-origin-opener-policy-coop-support), which is bundled with vite and your installed version of `@azure/msal-browser`.

The path of the redirect page can be configured with `redirectBridgePath`:

```ts
msal({
  redirectBridgePath: "/auth/redirect"
})
```

> [!IMPORTANT]
> If you haven't had a redirect bridge earlier, remember to update your redirect URIs in Entra ID.

### Cross-Origin-Opener-Policy header

The COOP header is returned by the authentication service and requires the application to have a redirect bridge (which this plugin provides). You do not need to serve the COOP header yourself, but if you choose to, configure `coopHeader` and the plugin will add it to all pages except the redirect bridge during dev/preview.

```ts
msal({
  coopHeader: "same-origin"
})
```

> [!IMPORTANT]
> The plugin can only configure this for the dev and preview server. It is your responsibility to ensure your deployments return the header correctly in production.

### Bypass metadata resolution

This plugin can optionally pre-fetch cloud discovery and OpenID metadata at build time, described in the [`msal-common` Performance docs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/performance.md).

> [!NOTE]
> This is **not needed** when using the standard `login.microsoftonline.com` authority — MSAL already includes hardcoded metadata for it. This option exists as an escape hatch for applications using a non-standard authority where MSAL cannot resolve metadata on its own. See [MSAL issue #8392](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/8392) for context.

Configure the `authority` option in the plugin to fetch metadata at build time:

```ts
msal({
  authority: "https://login.example.com/tenant-id"
})
```

Then use `withMetadata` to apply the pre-fetched metadata to your MSAL config:

```ts
import { withMetadata } from "@intility/vite-plugin-msal/client";
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = withMetadata({
  auth: {
    clientId: "your-client-id",
  },
});

const instance = new PublicClientApplication(msalConfig);
```

If `authority` is not set in your MSAL config, the plugin's configured authority will be applied automatically. If it is set, it must match the authority passed to the plugin.

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
	plugins: [msal({
	  // optional - defaults to `/redirect`
	  redirectBridgePath: "/redirect",
		// optonal - defaults to `true`
		emitCoopHeaders: true,
	})]
});
```

## Features

### Redirect Bridge

This plugin automatically emits a redirect bridge described in , which is bundled with vite and your installed version of `@azure/msal-browser`.

If you haven't had a redirect bridge earlier, remember to update your redirect URIs in Entra ID.

The path of the redirect page can be configured with `redirectBridgePath`.

### Cross-Origin-Opener-Policy header

On the dev server, return Cross-Origin-Opener-Policy header for all pages, except the redirect bridge.

Note that the plugin can only configure correct behavior for the dev server. It is your responsibility to ensure your deployments returns the header in the correct scenarios. 

### Buypass metadata resolution

This plugin adds automatic support for buypassing metadata resolution, described in the [`msal-common` Performance docs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/performance.md).

It does so by fetching the metadata during the vite `build` or `dev` startup, and injecting it into the bundle.

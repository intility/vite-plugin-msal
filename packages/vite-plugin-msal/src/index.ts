import { resolve } from "node:path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { addBuildInput } from "./utils.js";

/** Configuration options for the MSAL Vite plugin. */
export type VitePluginMsalConfig = {
  /**
   * The URL path for the MSAL redirect bridge page.
   *
   * @defaultValue `"/redirect"`
   */
  redirectBridgePath: string;
  /**
   * The authority URL used to pre-fetch cloud discovery and OpenID metadata at build time.
   * When set, metadata is injected as build-time constants and can be applied using
   * {@link withMetadata | `withMetadata`} from `@intility/vite-plugin-msal/client`.
   *
   * @example `"https://login.microsoftonline.com/common"`
   */
  authority?: string;
  /**
   * Whether to add `Cross-Origin-Opener-Policy: same-origin` headers during dev/preview.
   * The header is added to all pages except the redirect bridge path to avoid breaking
   * popup and silent-based auth flows.
   *
   * @remarks The plugin can only configure this for the dev and preview servers.
   * You are responsible for returning the header correctly in production deployments.
   *
   * @defaultValue `true`
   */
  addCoopHeader: boolean;
};

const defaultConfig: VitePluginMsalConfig = {
  redirectBridgePath: "/redirect",
  addCoopHeader: true,
};

async function fetchMsalMetadata(authority: string) {
  const cloudDiscoveryUrl = `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=${encodeURIComponent(`${authority}/oauth2/v2.0/authorize`)}`;
  const authorityMetadataUrl = `${authority}/v2.0/.well-known/openid-configuration`;

  const [cloudDiscoveryResult, authorityMetadataResult] =
    await Promise.allSettled([
      fetch(cloudDiscoveryUrl).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      }),
      fetch(authorityMetadataUrl).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      }),
    ]);

  if (cloudDiscoveryResult.status === "rejected") {
    console.warn(
      `[vite-plugin-msal] Failed to fetch cloud discovery metadata: ${cloudDiscoveryResult.reason}`,
    );
  }
  if (authorityMetadataResult.status === "rejected") {
    console.warn(
      `[vite-plugin-msal] Failed to fetch authority metadata: ${authorityMetadataResult.reason}`,
    );
  }

  return {
    cloudDiscoveryMetadata:
      cloudDiscoveryResult.status === "fulfilled"
        ? cloudDiscoveryResult.value
        : undefined,
    authorityMetadata:
      authorityMetadataResult.status === "fulfilled"
        ? authorityMetadataResult.value
        : undefined,
  };
}

const redirectEntryModule = "@intility/vite-plugin-msal/redirect";
const virtualRedirectHtml = "virtual:msal-redirect.html";

function redirectHtml(body = ""): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Authentication Redirect</title>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function useCoopHeader(
  server: ViteDevServer | PreviewServer,
  config: VitePluginMsalConfig,
) {
  if (!config.addCoopHeader) return;

  server.middlewares.use((req, res, next) => {
    const pathname = req.originalUrl?.split("?")[0];
    if (
      pathname !== config.redirectBridgePath &&
      pathname !== `${config.redirectBridgePath}.html`
    ) {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    }
    next();
  });
}

/**
 * Vite plugin that integrates MSAL authentication into your application.
 *
 * This plugin:
 * - Generates a redirect bridge HTML page for handling auth redirects in popups/iframes.
 * - Optionally pre-fetches OIDC and cloud discovery metadata at build time (when {@link VitePluginMsalConfig.authority | `authority`} is set).
 * - Adds `Cross-Origin-Opener-Policy` headers during dev/preview for all pages except the redirect bridge, so that COOP can be used without breaking popup and silent-based auth.
 *
 * @param config - Optional plugin configuration.
 * @returns A Vite plugin.
 *
 * @example
 * ```ts
 * import msal from "@intility/vite-plugin-msal";
 *
 * export default defineConfig({
 *   plugins: [
 *     msal({ authority: "https://login.microsoftonline.com/common" }),
 *   ],
 * });
 * ```
 */
export default function msal(config?: Partial<VitePluginMsalConfig>): Plugin {
  const mergedConfig = { ...defaultConfig, ...config };
  // Normalize: ensure leading / and strip trailing .html
  mergedConfig.redirectBridgePath = mergedConfig.redirectBridgePath
    .replace(/\.html$/, "")
    .replace(/^\/?/, "/");
  let resolvedId: string;

  return {
    name: "vite-plugin-msal",

    async config(userConfig) {
      const root = userConfig.root ?? process.cwd();
      const htmlFileName = `${mergedConfig.redirectBridgePath.slice(1)}.html`;
      resolvedId = resolve(root, htmlFileName);

      addBuildInput(
        userConfig,
        htmlFileName,
        virtualRedirectHtml,
        resolve(root, "index.html"),
      );

      if (mergedConfig.authority) {
        const { cloudDiscoveryMetadata, authorityMetadata } =
          await fetchMsalMetadata(mergedConfig.authority);

        const define: Record<string, string> = {};
        define.__VITE_PLUGIN_MSAL_METADATA_AUTHORITY__ = JSON.stringify(
          mergedConfig.authority,
        );
        if (cloudDiscoveryMetadata) {
          define.__VITE_PLUGIN_MSAL_CLOUD_DISCOVERY_METADATA__ = JSON.stringify(
            cloudDiscoveryMetadata,
          );
        }
        if (authorityMetadata) {
          define.__VITE_PLUGIN_MSAL_AUTHORITY_METADATA__ =
            JSON.stringify(authorityMetadata);
        }

        return { define };
      }
    },

    resolveId(id) {
      if (id === virtualRedirectHtml) {
        return resolvedId;
      }
    },

    load(id) {
      if (id === resolvedId) {
        return redirectHtml();
      }
    },

    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (ctx.filename !== resolvedId) return;

        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: { type: "module", src: redirectEntryModule },
              injectTo: "body",
            },
          ],
        };
      },
    },

    generateBundle(_, bundle) {
      // The redirect page is a secondary HTML page, not the app's primary
      // entry. Strip `isEntry` so framework manifest plugins (e.g. TanStack
      // Start) that expect a single entry are not confused by it.
      for (const chunk of Object.values(bundle)) {
        if (
          chunk.type === "chunk" &&
          chunk.isEntry &&
          chunk.facadeModuleId === resolvedId
        ) {
          chunk.isEntry = false;
        }
      }
    },

    configureServer(server) {
      useCoopHeader(server, mergedConfig);

      server.middlewares.use((req, res, next) => {
        const pathname = req.originalUrl?.split("?")[0];
        if (
          !req.originalUrl ||
          (pathname !== mergedConfig.redirectBridgePath &&
            pathname !== `${mergedConfig.redirectBridgePath}.html`)
        ) {
          return next();
        }

        const html = redirectHtml(
          `<script type="module">import "${redirectEntryModule}";</script>`,
        );
        server.transformIndexHtml(req.originalUrl, html).then((transformed) => {
          res.setHeader("Content-Type", "text/html");
          res.statusCode = 200;
          res.end(transformed);
        });
      });
    },

    configurePreviewServer(server) {
      useCoopHeader(server, mergedConfig);
    },
  };
}

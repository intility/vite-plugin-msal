import { resolve } from "node:path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { addBuildInput } from "./utils.js";

export type CoopHeader =
  | "unsafe-none"
  | "same-origin-allow-popups"
  | "same-origin"
  | "noopener-allow-popups"
  | (string & {});

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
   * @remarks This is **not needed** when using the standard `login.microsoftonline.com`
   * authority — MSAL already includes hardcoded metadata for it. This option exists as an
   * escape hatch for applications using a non-standard authority where MSAL cannot resolve
   * metadata on its own.
   *
   * @see {@link https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/8392 | MSAL issue #8392}
   *
   * @example `"https://login.microsoftonline.com/common"`
   */
  authority?: string;
  /**
   * The `Cross-Origin-Opener-Policy` header directive to serve during dev/preview.
   * When set, the header is added to all pages **except** the redirect bridge,
   * so that COOP can be used without breaking popup and silent-based auth flows.
   *
   * The COOP header is returned by the authentication service and requires the
   * application to have a redirect bridge (which this plugin provides). You do not
   * need to serve this header yourself, but if you choose to, it must **not** be
   * served on the redirect bridge page.
   *
   * @remarks The plugin can only configure this for the dev and preview servers.
   * You are responsible for returning the header correctly in production deployments.
   *
   * @example `"same-origin"`
   */
  coopHeader?: CoopHeader;
};

const defaultConfig: VitePluginMsalConfig = {
  redirectBridgePath: "/redirect",
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
  const { coopHeader } = config;
  if (!coopHeader) return;

  server.middlewares.use((req, res, next) => {
    const pathname = req.originalUrl?.split("?")[0];
    if (
      pathname !== config.redirectBridgePath &&
      pathname !== `${config.redirectBridgePath}.html`
    ) {
      res.setHeader("Cross-Origin-Opener-Policy", coopHeader);
    }
    next();
  });
}

/**
 * Vite plugin that integrates MSAL authentication into your application.
 *
 * This plugin:
 * - Generates a redirect bridge HTML page for handling auth redirects in popups/iframes.
 * - Optionally pre-fetches OIDC and cloud discovery metadata at build time (when {@link VitePluginMsalConfig.authority | `authority`} is set). This is only needed for non-standard authorities; `login.microsoftonline.com` metadata is hardcoded in MSAL.
 * - Optionally adds a `Cross-Origin-Opener-Policy` header during dev/preview for all pages except the redirect bridge (when {@link VitePluginMsalConfig.coopHeader | `coopHeader`} is set).
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

    writeBundle(_, bundle) {
      // Strip isEntry on the redirect chunk AFTER Vite has emitted the HTML
      // (which needs isEntry=true to link the script tag). This prevents
      // framework manifest plugins (e.g. TanStack Start) that run in a
      // subsequent build phase from seeing multiple entry chunks.
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

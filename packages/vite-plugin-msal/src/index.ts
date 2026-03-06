import { resolve } from "node:path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { addBuildInput } from "./utils.js";

type VitePluginMsalConfig = {
  redirectBridgePath: string;
  authority?: string;
  addCoopHeader: boolean;
};

const defaultConfig: VitePluginMsalConfig = {
  redirectBridgePath: "redirect",
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

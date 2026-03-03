import { resolve } from "node:path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { addBuildInput } from "./utils.js";

type VitePluginMsalConfig = {
	redirectBridgePath: string;
};

const defaultConfig: VitePluginMsalConfig = {
	redirectBridgePath: "/redirect",
};

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
	server.middlewares.use((req, res, next) => {
		const pathname = req.originalUrl?.split("?")[0];
		if (pathname !== config.redirectBridgePath) {
			res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		}
		next();
	});
}

export default function msal(config?: Partial<VitePluginMsalConfig>): Plugin {
	const mergedConfig = { ...defaultConfig, ...config };
	let resolvedId: string;

	return {
		name: "vite-plugin-msal",

		config(userConfig) {
			const root = userConfig.root ?? process.cwd();
			const htmlFileName = `${mergedConfig.redirectBridgePath.replace(/^\//, "")}.html`;
			resolvedId = resolve(root, htmlFileName);

			addBuildInput(
				userConfig,
				htmlFileName,
				virtualRedirectHtml,
				resolve(root, "index.html"),
			);
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
				if (!req.originalUrl || pathname !== mergedConfig.redirectBridgePath) {
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

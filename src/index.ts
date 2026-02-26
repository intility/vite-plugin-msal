import type { Plugin, PreviewServer, ViteDevServer } from "vite";

type VitePluginMsalConfig = {
	redirectBridgePath: string;
};

const defaultConfig: VitePluginMsalConfig = {
	redirectBridgePath: "/redirect",
};

const redirectEntryModule = "@intility/vite-plugin-msal/redirect";

function redirectHtmlBuild(scriptSrc: string): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Authentication Redirect</title></head>
<body>
  <script type="module" src="${scriptSrc}"></script>
</body>
</html>`;
}

function redirectHtmlDev(importSpecifier: string): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Authentication Redirect</title></head>
<body>
  <script type="module">import "${importSpecifier}";</script>
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
	let base = "/";
	let isBuild = false;
	let chunkRefId: string;

	return {
		name: "vite-plugin-msal",

		configResolved(resolvedConfig) {
			base = resolvedConfig.base;
			isBuild = resolvedConfig.command === "build";
		},

		buildStart() {
			if (!isBuild) return;

			chunkRefId = this.emitFile({
				type: "chunk",
				id: redirectEntryModule,
			});
		},

		generateBundle() {
			const chunkFileName = this.getFileName(chunkRefId);
			const fileName =
				mergedConfig.redirectBridgePath.replace(/^\//, "") + ".html";

			this.emitFile({
				type: "asset",
				fileName,
				source: redirectHtmlBuild(base + chunkFileName),
			});
		},

		configureServer(server) {
			useCoopHeader(server, mergedConfig);

			server.middlewares.use((req, res, next) => {
				const pathname = req.originalUrl?.split("?")[0];
				if (pathname !== mergedConfig.redirectBridgePath) {
					return next();
				}

				server
				.transformIndexHtml(
					req.originalUrl!,
					redirectHtmlDev(redirectEntryModule),
				)
				.then((html) => {
					res.setHeader("Content-Type", "text/html");
					res.statusCode = 200;
					res.end(html);
				});
			});
		},

		configurePreviewServer(server) {
			useCoopHeader(server, mergedConfig);
		},
	};
}

import type { Configuration } from "@azure/msal-browser";

declare const __VITE_PLUGIN_MSAL_CLOUD_DISCOVERY_METADATA__: string | undefined;
declare const __VITE_PLUGIN_MSAL_AUTHORITY_METADATA__: string | undefined;
declare const __VITE_PLUGIN_MSAL_METADATA_AUTHORITY__: string | undefined;

/**
 * Enhances an MSAL {@link https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.Configuration.html | `Configuration`}
 * with cloud discovery and authority metadata that was pre-fetched at build time,
 * enabling {@link https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/performance.md | bypassing metadata resolution}
 * for improved performance.
 *
 * This function reads build-time constants injected by the plugin when
 * {@link VitePluginMsalConfig.authority | `authority`} is configured. If no metadata is available,
 * or if the config authority does not match the authority used during the build, the
 * original configuration is returned unchanged.
 *
 * @param config - The MSAL browser configuration to enhance.
 * @returns The configuration with pre-fetched metadata merged into `auth`, or the original config if no metadata is available.
 *
 * @example
 * ```ts
 * import { withMetadata } from "@intility/vite-plugin-msal/client";
 *
 * const msalConfig = withMetadata({
 *   auth: {
 *     clientId: "your-client-id",
 *     authority: "https://login.microsoftonline.com/common",
 *   },
 * });
 * ```
 */
export function withMetadata(config: Configuration): Configuration {
  const cloudDiscoveryMetadata =
    typeof __VITE_PLUGIN_MSAL_CLOUD_DISCOVERY_METADATA__ !== "undefined"
      ? __VITE_PLUGIN_MSAL_CLOUD_DISCOVERY_METADATA__
      : undefined;
  const authorityMetadata =
    typeof __VITE_PLUGIN_MSAL_AUTHORITY_METADATA__ !== "undefined"
      ? __VITE_PLUGIN_MSAL_AUTHORITY_METADATA__
      : undefined;
  const metadataAuthority =
    typeof __VITE_PLUGIN_MSAL_METADATA_AUTHORITY__ !== "undefined"
      ? __VITE_PLUGIN_MSAL_METADATA_AUTHORITY__
      : undefined;

  if (!cloudDiscoveryMetadata && !authorityMetadata) {
    return config;
  }

  const configAuthority =
    config.auth?.authority ?? "https://login.microsoftonline.com/common";

  if (metadataAuthority && configAuthority !== metadataAuthority) {
    console.warn(
      `[vite-plugin-msal] Authority mismatch: config has "${configAuthority}" but metadata was fetched for "${metadataAuthority}". Skipping metadata.`,
    );
    return config;
  }

  return {
    ...config,
    auth: {
      ...config.auth,
      ...(cloudDiscoveryMetadata && { cloudDiscoveryMetadata }),
      ...(authorityMetadata && { authorityMetadata }),
    },
  };
}

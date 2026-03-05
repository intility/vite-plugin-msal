import type { Configuration } from "@azure/msal-browser";

declare const __VITE_PLUGIN_MSAL_CLOUD_DISCOVERY_METADATA__: string | undefined;
declare const __VITE_PLUGIN_MSAL_AUTHORITY_METADATA__: string | undefined;
declare const __VITE_PLUGIN_MSAL_METADATA_AUTHORITY__: string | undefined;

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

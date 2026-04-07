import type { UserConfig } from "vite";

type InputOption = string | string[] | Record<string, string>;

/**
 * Read bundler options from a build config, preferring `rolldownOptions`
 * (Vite 8+) and falling back to `rollupOptions` (Vite 7).
 */
function getBundlerOptions(build: Record<string, unknown> | undefined) {
  // biome-ignore lint/suspicious/noExplicitAny: accessing untyped Vite 8 field
  return (build as any)?.rolldownOptions ?? build?.rollupOptions;
}

/**
 * Add a named entry to the Vite build input, normalizing the existing
 * input (string | string[] | object | undefined) to object form.
 *
 * When a framework has configured environment-level build input
 * (e.g. `environments.client.build.rollupOptions.input` or
 * `environments.client.build.rolldownOptions.input`), the entry is
 * added there instead of the shared `build.rollupOptions.input`. This
 * ensures compatibility with frameworks like TanStack Start that use
 * the Vite environment API and may set `rolldownOptions` on Vite 8.
 *
 * @param fallbackInput - Used only when no existing shared input is set.
 *   Vanilla Vite defaults to `index.html` at root, so this should be
 *   passed to preserve that behavior when adding a secondary entry.
 *   Ignored when environment-level input exists (frameworks manage
 *   their own primary entry).
 */
export function addBuildInput(
  userConfig: UserConfig,
  name: string,
  entry: string,
  fallbackInput?: string,
): void {
  const clientBuild = userConfig.environments?.client?.build;
  const envBundlerOptions = getBundlerOptions(
    clientBuild as Record<string, unknown> | undefined,
  );

  if (envBundlerOptions?.input !== undefined) {
    // A framework has set environment-level input — add there.
    // No fallback needed: the framework already defined its primary entry.
    const normalized = normalizeRollupInput(envBundlerOptions.input);
    envBundlerOptions.input = { ...normalized, [name]: entry };
  } else {
    // Vanilla Vite or framework using shared input — add to shared config.
    userConfig.build ??= {};
    userConfig.build.rollupOptions ??= {};

    const existing = userConfig.build.rollupOptions.input;
    const normalized = normalizeRollupInput(existing ?? fallbackInput);

    userConfig.build.rollupOptions.input = {
      ...normalized,
      [name]: entry,
    };
  }
}

/**
 * Check whether a framework has configured environment-level build input
 * (via `rollupOptions` or `rolldownOptions`).
 */
export function hasEnvironmentInput(userConfig: UserConfig): boolean {
  const clientBuild = userConfig.environments?.client?.build;
  const envBundlerOptions = getBundlerOptions(
    clientBuild as Record<string, unknown> | undefined,
  );
  return envBundlerOptions?.input !== undefined;
}

function normalizeRollupInput(
  input: InputOption | undefined,
): Record<string, string> {
  if (!input) return {};
  if (typeof input === "string") return { main: input };
  if (Array.isArray(input)) {
    return Object.fromEntries(input.map((v, i) => [`entry${i}`, v]));
  }
  return input;
}

import type { InputOption } from "rollup";
import type { UserConfig } from "vite";

/**
 * Add a named entry to the Vite build input, normalizing the existing
 * input (string | string[] | object | undefined) to object form.
 *
 * When a framework has configured environment-level build input
 * (e.g. `environments.client.build.rollupOptions.input`), the entry is
 * added there instead of the shared `build.rollupOptions.input`. This
 * ensures compatibility with frameworks like TanStack Start that use
 * the Vite 7 environment API.
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
  if (
    userConfig.environments?.client?.build?.rollupOptions?.input !== undefined
  ) {
    // A framework has set environment-level input — add there.
    // No fallback needed: the framework already defined its primary entry.
    const normalized = normalizeRollupInput(
      userConfig.environments.client.build.rollupOptions.input,
    );
    userConfig.environments.client.build.rollupOptions.input = {
      ...normalized,
      [name]: entry,
    };
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

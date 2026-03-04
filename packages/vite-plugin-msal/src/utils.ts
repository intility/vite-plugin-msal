import type { InputOption } from "rollup";
import type { UserConfig } from "vite";

/**
 * Add a named entry to the Vite build input, normalizing the existing
 * input (string | string[] | object | undefined) to object form.
 */
export function addBuildInput(
  userConfig: UserConfig,
  name: string,
  entry: string,
  fallbackInput?: string,
): void {
  userConfig.build ??= {};
  userConfig.build.rollupOptions ??= {};

  const existing = userConfig.build.rollupOptions.input;
  const normalized = normalizeRollupInput(existing ?? fallbackInput);

  userConfig.build.rollupOptions.input = {
    ...normalized,
    [name]: entry,
  };
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

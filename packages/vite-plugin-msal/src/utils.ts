import type { InputOption } from "rollup";

/**
 * Normalize Rollup's InputOption (string | string[] | Record<string, string>)
 * to an object form so it can be safely deep-merged with additional entries.
 */
export function normalizeRollupInput(
	input: InputOption,
): Record<string, string> {
	if (typeof input === "string") {
		return { main: input };
	}
	if (Array.isArray(input)) {
		return Object.fromEntries(input.map((v, i) => [`entry${i}`, v]));
	}
	return input;
}

# @intility/vite-plugin-msal

## 0.4.0

### Minor Changes

- 0c4406f: Authority from the plugin will now be applied to the msal config if it's not specified
- 0c4406f: Replace `addCoopHeader` (which defaulted to `true`) with an optional `coopHeader` directive. COOP headers are no longer emitted by default — set `coopHeader: "same-origin"` to restore the previous behavior.

### Patch Changes

- 62b7440: Support vite 8
- 62b7440: Support meta-frameworks (react-router framework mode & tanstack start)

## 0.3.1

### Patch Changes

- 1c93464: add tsdoc

## 0.3.0

### Minor Changes

- 4359fd1: allow `redirectBridgePath` to work with and without leading `/` and trailing `.html`
- 4359fd1: allow controlling wether the dev and preview server emits COOP headers
- 4359fd1: only fetch authority metadata if it is defined

## 0.2.0

### Minor Changes

- 6081891: add support for bypassing authority and cloud instance metadata resolution

## 0.1.1

### Patch Changes

- 4cd6405: update code example in readme

## 0.1.0

### Minor Changes

- 16ebc59: initial support for redirect bridge and COOP headers

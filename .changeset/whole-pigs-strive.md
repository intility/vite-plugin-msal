---
"@intility/vite-plugin-msal": minor
---

Replace `addCoopHeader` (which defaulted to `true`) with an optional `coopHeader` directive. COOP headers are no longer emitted by default — set `coopHeader: "same-origin"` to restore the previous behavior.

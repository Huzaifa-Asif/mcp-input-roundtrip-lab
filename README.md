# MCP Input Roundtrip Lab

Offline browser and CLI analysis for saved MCP `2026-07-28` Multi Round-Trip Request (MRTR) transcripts. It follows `input_required` responses into retries and checks opaque `requestState` echo, outstanding input keys, retry identity, repeated input keys, result boundaries and incomplete flows.

## Quick start

```sh
node cli.mjs examples/safe.json
npm run check
```

Open `index.html` through any static server for the browser UI. Input is either a step array or `{ "steps": [...] }`. Each step has `direction` (`client_to_server` or `server_to_client`) and a JSON-RPC `message`.

## Report contract

The report contains a summary, bounded flow summaries and findings with exactly `code`, `severity`, `step`, `flow`, `message`, and `evidence`. Errors make the CLI exit 1; malformed or unreadable input exits 2. Displayed findings are capped at 500 while total errors and dropped findings remain counted.

## Security and privacy

The browser has no catalog upload, account, analytics or persistence. The CLI reads at most 2 MiB plus one detection byte. Analysis is data-only: strings are never executed or inserted as HTML. Input is bounded to 2,000 steps, 256 nesting levels and 100,000 containers; evidence is control-stripped and truncated. Reports can still expose method names and selected identifiers, so review before sharing.

## Limits

This is not a full MCP conformance suite, live endpoint probe, JSON Schema validator, task-lifecycle checker, client/server implementation, authorization audit or proof that `requestState` is integrity-protected. It cannot observe timeouts, cancellation, user consent, network behavior, SDK internals or byte preservation before/after the supplied transcript. Findings use the current draft extension/specification sources noted in [docs/RESEARCH.md](docs/RESEARCH.md); evolving protocol text can require updates.

## Accessibility and support

The UI has native keyboard controls, a labeled editor, visible focus, responsive layout and a concise live status separate from the full report. Real screen-reader and mobile-host testing remain manual. See [SUPPORT.md](SUPPORT.md), [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [CONTRIBUTING.md](CONTRIBUTING.md).

## Release status

The lab is a static developer utility, not an MCP server or plugin package. A website deployment is not an OpenAI directory submission, approval or publication. See [docs/RELEASE.md](docs/RELEASE.md) for the evidence gates.

MIT licensed. This independent project is not endorsed by OpenAI or the MCP maintainers.

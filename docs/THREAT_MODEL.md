# Threat model

Untrusted transcripts may be malformed, deeply nested, oversized, contain terminal controls, secrets or instruction-like strings, and intentionally create finding storms. Controls are strict envelopes, bounded reads/steps/depth/containers/findings, data-only parsing, `textContent` rendering, bounded evidence and no network/storage/telemetry. Residual risk: a shared report may disclose method names, flow shape and bounded evidence; this tool cannot prove state integrity or authorization.

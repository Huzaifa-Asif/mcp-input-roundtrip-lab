# Security policy

Please report a suspected vulnerability privately through GitHub Security Advisories. Do not include production transcripts, access tokens, credentials, or personal data in a public issue.

Version 0.1.x receives best-effort security fixes. The lab treats transcript strings as untrusted data, does not execute them, uses `textContent` in the UI, places hard bounds on input and output, and makes no network requests. It is not a sandbox, secret scanner, authorization audit, or substitute for MCP implementation review.

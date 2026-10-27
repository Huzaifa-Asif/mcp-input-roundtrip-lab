# Research and novelty boundary

Checked 2026-10-28 MYT. MRTR replaces reverse server-to-client calls with `input_required`, keyed responses and a retry of the original request. Current SDK and conformance reports show missing client support, active-retry cancellation mistakes, caller-parameter mutation and invalid synthetic response keys.

- MCP MRTR overview: https://modelcontextprotocol.io/specification/draft/basic/patterns
- SEP-2322: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/seps/2322-MRTR.md
- Copilot CLI support gap: https://github.com/github/copilot-cli/issues/4834
- LangChain4j retry cancellation defect: https://github.com/langchain4j/langchain4j/issues/6238
- Go SDK caller mutation: https://github.com/modelcontextprotocol/go-sdk/issues/1144
- Conformance harness key defect: https://github.com/modelcontextprotocol/conformance/issues/440

Alternatives include the official conformance suite, MCP Inspector and `mcp-spec-check`. Those exercise implementations or live endpoints. This tool only analyzes a supplied transcript, makes no conformance claim, and intentionally excludes Tasks.

## Architecture and release fit

OpenAI's current plugin guidance uses `plugin.json` plus optional skills, MCP servers and MCP Apps UI. Directory review expects an original, complete, reliable integration and, for an attached MCP app, public website, support, privacy and terms URLs. This lab is deliberately a standalone static diagnostic utility: it has no MCP server, tool schema, authentication, write action, model/API dependency, or plugin package. A GitHub Pages release is therefore a website deployment, not an OpenAI directory submission or publication.

- Plugin architecture: https://developers.openai.com/plugins/build/plugins
- MCP Apps UI and capability detection: https://developers.openai.com/plugins/build/chatgpt-ui
- OAuth guidance: https://developers.openai.com/plugins/build/auth
- Directory guidelines: https://developers.openai.com/plugins/plugin-guidelines
- Submission fields and review: https://developers.openai.com/plugins/deploy/submission

GitHub's current documentation says Pages is available for public repositories on GitHub Free. A published site may be at most 1 GB, with soft limits of 100 GB bandwidth per month and 10 builds per hour. Standard GitHub-hosted runners are free for public repositories; larger runners are billed and are not used here.

- Pages availability: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Actions billing: https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions

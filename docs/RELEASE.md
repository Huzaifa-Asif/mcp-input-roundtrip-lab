# Release checklist

- Confirm the authenticated GitHub user is `Huzaifa-Asif` and the target repository is personal and public.
- Run `npm ci --ignore-scripts` followed by `npm run check` on a clean checkout.
- Inspect `git status --short`, `git diff --cached --name-only`, and the release archive manifest.
- Keep launch articles and covers outside the repository, build directory, and release assets.
- Confirm the build contains only the static UI, analyzer and synthetic example.
- Push a signed commit and tag, then verify the remote commit and exact-commit CI.
- Verify the deployed HTTPS bytes and browser journey before calling the website live.
- Record deployment, release, directory submission, approval and publication as separate states.

This project is not currently eligible or intended for OpenAI directory submission because it does not expose an MCP server or plugin package. It must not be represented as a listed ChatGPT/Codex app.

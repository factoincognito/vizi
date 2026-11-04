# Third-party notices

Policy: `policies/third-party-ip.md` in factoincognito/product-office. This file
lists the third-party material this repo uses, with source, exact version,
licence, use and mode. Material the product owner or his companies own is not
listed (vizi's own files are PolyForm Noncommercial 1.0.0, see `LICENSE`).

Last checked: 2026-11-04.

## CI reviewer (`.github/reviewer/`)

Crog's pull request review in CI (PO-68 pilot). It runs in GitHub Actions only
and is installed there from `.github/reviewer/package-lock.json`. It is not in
the root `package.json` and is never part of the built page. Use: internal
tooling.

| Component | Version | Licence | Source | Mode |
|---|---|---|---|---|
| `@anthropic-ai/claude-agent-sdk` | 0.3.318 | Vendor SDK: "© Anthropic PBC. All rights reserved. Use is subject to the Legal Agreements outlined here: https://code.claude.com/docs/en/legal-and-compliance" (`LICENSE.md` in the package), which points to Anthropic's [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) for API users | https://github.com/anthropics/claude-agent-sdk-typescript, npm | depend |
| `@anthropic-ai/claude-agent-sdk-<platform>` (the SDK's bundled Claude Code binary; CI installs `linux-x64`) | 0.3.318 | Same as the SDK (`LICENSE.md`) | npm | depend, unmodified |
| `@anthropic-ai/sdk` (the SDK's peer dependency) | 1.4.0 | Apache-2.0 | npm | depend |
| `@modelcontextprotocol/sdk` (peer) | 1.32.2 | MIT | npm | depend |
| `zod` (peer) | 4.6.7 | MIT | npm | depend |
| `yaml` (test only) | 2.9.1 | ISC | npm | depend |

The other 100 packages in that lockfile are transitive. Their licence fields
(read from the lockfile on 2026-11-04): MIT 88, ISC 7, BSD-3-Clause 2,
BSD-2-Clause 1, Apache-2.0 1 (`@opentelemetry/api`), Unlicense 1. None is
copyleft or non-commercial, none has an install script, and none is copied,
modified or shipped, so no Apache-2.0 NOTICE file is carried.

The terms that matter for this use (read 2026-11-04): the Agent SDK is used with
an API key from the Claude Console, billed to the key's owner; the binary is
unmodified; nothing is offered to end users, resold or intermediated; the
Commercial Terms D.4 bans (building a competing product or service, resale,
reverse engineering the Services) do not apply. Not legal advice.

## Build and test tooling (root `package.json`, devDependencies)

Not shipped as such; they build, lint and test the page. Licences read with
`npm view <package>@<version> license` on 2026-11-04.

| Component | Version | Licence |
|---|---|---|
| `@biomejs/biome` | 2.5.15 | MIT OR Apache-2.0 |
| `@playwright/test` | 1.63.0 | Apache-2.0 |
| `@types/jest` | 30.0.0 | MIT |
| `jest` | 30.5.2 | MIT |
| `ts-jest` | 29.4.14 | MIT |
| `typescript` | 6.0.3 | Apache-2.0 |
| `vite` | 8.3.1 | MIT |
| `vite-plugin-singlefile` | 2.3.3 | MIT |
| `yaml` | 2.9.1 | ISC |

Their transitive dependencies (root `package-lock.json`) have not been checked
licence by licence. Open: `docs/NEXT_SESSION.md`, entry 3 (this also covers
Vite's code that ends up inside the built page).

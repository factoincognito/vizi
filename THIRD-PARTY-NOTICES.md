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
| `@anthropic-ai/claude-agent-sdk-<platform>` (the SDK's bundled Claude Code binary; CI installs the `linux-x64` and `linux-x64-musl` ones) | 0.3.318 | Same as the SDK (`LICENSE.md`) | npm | depend, unmodified |
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
licence by licence. Vite's own code that ships in the built page has its entry
below.

## Vite (code in the built page)

The build copies one piece of Vite's own code into `dist/index.html`: its
module-preload polyfill, at the start of the page's inline script (`docs/SPEC.md`
section 4, item 22). So that piece ships to every user of the page. Use:
shipped, in the published page. Mode: depend, unmodified (the build tool emits
it; nothing in vizi copies or changes it).

- **Component:** Vite 8.3.1 (`node_modules/vite/package.json`, read
  2026-11-04), https://github.com/vitejs/vite, npm `vite@8.3.1`.
- **Licence:** MIT, from `node_modules/vite/LICENSE.md` ("Vite core
  license"), word for word:

```
MIT License

Copyright (c) 2019-present, VoidZero Inc. and Vite contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The polyfill was found by reading the built page for Vite's `modulepreload`
code. The rest of the inline script is vizi's own code, bundled; it was not
checked line by line for other code of Vite's own dependencies.

## Inter (the page's font, `src/fonts/`)

The font of vizi's page (`docs/SPEC.md` 3.12, "The font"; PBI-1.16). Use:
shipped, in the published page; vizi does not sell the font, alone or
otherwise. Mode: copy/adapt, a subset bundled in the page, with attribution.

- **Component:** Inter 4.1, https://github.com/rsms/inter, tag `v4.1`, commit
  `e3a3d4c57d5ecc01453a575621882a384c1995a3` (fetched through git; its
  `version.txt` reads `4.1`).
- **Copyright:** "Copyright (c) 2016 The Inter Project Authors
  (https://github.com/rsms/inter)".
- **Licence:** SIL Open Font License 1.1. Full text in
  `licenses/OFL-1.1-Inter.txt`, which is `LICENSE.txt` at `v4.1` word for word
  (blob `9b2ca37b3ffc77391d8b2ebef4a974ef32bf46ea`). No Reserved Font Name is
  given.
- **What is used:** a subset of three weights, 400, 600 and 700, in
  `src/fonts/`, built into `dist/index.html` as `data:` URLs. It is a modified
  version (a subset) under the OFL. The files in `src/fonts/` are under the
  SIL Open Font License 1.1, not under vizi's own licence (`LICENSE`). Every
  name record is kept, so each file still carries its copyright and licence.
- **How the subset was made** (by hand, once; not in the build or CI), with
  fontTools 4.68.0 (MIT) and the Python Brotli module 1.2.1 (MIT), one run per
  weight:

  ```
  pyftsubset Inter-<Weight>.woff2 \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2192" \
    --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
    --name-IDs='*' --name-languages='*' --flavor=woff2 \
    --output-file=inter-latin-<weight>.woff2
  ```

| File | Bytes | SHA-256 |
|---|---|---|
| source `docs/font-files/Inter-Regular.woff2` | 111268 | `e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085` |
| source `docs/font-files/Inter-SemiBold.woff2` | 114812 | `5cb7103e4e605989afebc03d989c79201e54b21b5183db33981f70db9178a301` |
| source `docs/font-files/Inter-Bold.woff2` | 114840 | `fa888127b6da015b65569f0351f3b5c391ad928904951f1c20e9f8462a8d95ea` |
| result `src/fonts/inter-latin-400.woff2` | 14336 | `09f7060b39c4ab7cf05a457d226c1c73bf2108eddce324a7c9239a7899932e46` |
| result `src/fonts/inter-latin-600.woff2` | 14712 | `734665df975d0e5d308812a9cbade0df719eefe837f950815fff29a84a910b1e` |
| result `src/fonts/inter-latin-700.woff2` | 14600 | `0fa8884cf33c85e2be6c8aef4e22a6d855ecaae049a267fcdc95cb47fc3ca6a9` |

The page's footer credits the font and links to this file.

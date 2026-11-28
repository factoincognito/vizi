import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { addCsp } from "./src/csp";

/**
 * Adds the Content-Security-Policy of docs/SPEC.md 2.3 to the built page.
 * It runs after the single-file plugin (same `post` stage, later in the
 * list), so the hashes are of the script and style as they are inlined.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: "vizi:content-security-policy",
    enforce: "post",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const page = bundle["index.html"];
        if (page?.type !== "asset")
          throw new Error("The build has no index.html to add a policy to.");
        page.source = addCsp(String(page.source));
      },
    },
  };
}

/** The `version` of package.json: the page's version (docs/SPEC.md 3.17 item 2). */
const { version } = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
) as { version: string };

export default defineConfig({
  // The page reads no file and makes no request for its version: the build puts it in the code.
  define: { __VIZI_VERSION__: JSON.stringify(version) },
  plugins: [viteSingleFile(), contentSecurityPolicy()],
});

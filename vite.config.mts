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

export default defineConfig({
  plugins: [viteSingleFile(), contentSecurityPolicy()],
});

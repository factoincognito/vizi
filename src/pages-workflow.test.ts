/// <reference types="node" />
import { readFileSync } from "node:fs";
import { parse } from "yaml";

// Parses the GitHub Pages workflow and compares its structure, so layout (comments, blank
// lines, quoting, key order) cannot hide a change: any added trigger, permission, job or step
// makes the comparison fail.
type Step = Record<string, unknown>;
type Workflow = { jobs: Record<string, { steps?: Step[] } & Record<string, unknown>> } & Record<
  string,
  unknown
>;

const load = (path: string): Workflow => parse(readFileSync(path, "utf8")) as Workflow;
const dropNames = (steps: Step[] = []): Step[] => steps.map(({ name: _name, ...rest }) => rest);

describe("GitHub Pages workflow", () => {
  const pages = load(".github/workflows/pages.yml");
  const ci = load(".github/workflows/ci.yml");

  test("is exactly this structure: triggers, permissions, concurrency, two jobs and their steps", () => {
    const { name, jobs, ...top } = pages;
    expect(name).toBe("Pages");
    expect(top).toEqual({
      // A push to main and a manual run, nothing else (no pull_request, no schedule).
      on: { push: { branches: ["main"] }, workflow_dispatch: null },
      // Read-only contents for everything; a job that needs more says so itself.
      permissions: { contents: "read" },
      concurrency: { group: "pages", "cancel-in-progress": false },
    });
    // Exactly these two jobs; neither is named `build`, the required check of ci.yml.
    expect(Object.keys(jobs).sort()).toEqual(["deploy", "site"]);
    const { steps: siteSteps, ...site } = jobs.site as Workflow["jobs"][string];
    const { steps: deploySteps, ...deploy } = jobs.deploy as Workflow["jobs"][string];
    // `site` sets no permissions of its own, so it keeps contents: read.
    expect(site).toEqual({ "runs-on": "ubuntu-latest", "timeout-minutes": 15 });
    expect(dropNames(siteSteps)).toEqual([
      { uses: "actions/checkout@v7", with: { "persist-credentials": false } },
      {
        uses: "actions/setup-node@v7",
        with: { "node-version": "24", cache: "npm" },
      },
      { run: "npm ci" },
      { run: "npm run build" },
      { uses: "actions/upload-pages-artifact@v5", with: { path: "dist" } },
    ]);
    expect(deploy).toEqual({
      needs: "site",
      // Also stops a manual run started from another branch.
      if: "github.ref == 'refs/heads/main'",
      "runs-on": "ubuntu-latest",
      "timeout-minutes": 10,
      permissions: { pages: "write", "id-token": "write" },
      environment: {
        name: "github-pages",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: a GitHub Actions expression, not a template
        url: "${{ steps.deployment.outputs.page_url }}",
      },
    });
    expect(dropNames(deploySteps)).toEqual([{ id: "deployment", uses: "actions/deploy-pages@v5" }]);
  });

  test("builds with the toolchain and npm scripts CI uses", () => {
    const ciSteps = dropNames(ci.jobs.build?.steps);
    const siteSteps = dropNames(pages.jobs.site?.steps);
    // Same Node.js setup and the same install command.
    expect(ciSteps).toContainEqual(siteSteps[1]);
    expect(ciSteps).toContainEqual({ run: "npm ci" });
    // CI builds through test:e2e, which must still start with npm run build.
    expect(ciSteps).toContainEqual({ run: "npm run test:e2e" });
    const { scripts } = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(scripts["test:e2e"]).toMatch(/^npm run build && /);
    expect(scripts.build).toBe("vite build");
  });

  test("uses the same checkout version as CI", () => {
    const ciCheckout = dropNames(ci.jobs.build?.steps).find((step) =>
      String(step.uses).startsWith("actions/checkout@"),
    );
    expect(dropNames(pages.jobs.site?.steps)[0]?.uses).toBe(ciCheckout?.uses);
  });
});

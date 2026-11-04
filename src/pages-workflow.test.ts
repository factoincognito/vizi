/// <reference types="node" />
import { readFileSync } from "node:fs";

// Checks the GitHub Pages workflow as text, without a YAML library: the file's layout is
// fixed (two-space indent, one block per job), and a change to it must change these checks.
const workflowPath = ".github/workflows/pages.yml";
const read = (path: string): string => readFileSync(path, "utf8");

/** The text of one top-level job: from "  <name>:" to the next job or the end of the file. */
function job(workflow: string, name: string): string {
  const jobs = workflow.split(/^jobs:\s*$/m)[1] ?? "";
  const match = new RegExp(
    `^  ${name}:\\s*$([\\s\\S]*?)(?=^  [\\w-]+:\\s*$|(?![\\s\\S]))`,
    "m",
  ).exec(jobs);
  if (!match) {
    throw new Error(`job "${name}" not found in ${workflowPath}`);
  }
  return match[1] ?? "";
}

describe("GitHub Pages workflow", () => {
  const workflow = read(workflowPath);

  test("runs on a push to main and by hand, and on nothing else", () => {
    const triggers = workflow.split(/^jobs:/m)[0] ?? "";
    expect(triggers).toMatch(
      /^on:\s*\n {2}push:\s*\n {4}branches: \[main\]\s*\n {2}workflow_dispatch:/m,
    );
    expect(triggers).not.toMatch(/pull_request/);
  });

  test("gives the whole workflow read-only contents and nothing more", () => {
    const top = workflow.split(/^jobs:/m)[0] ?? "";
    expect(top).toMatch(/^permissions:\s*\n {2}contents: read\s*$/m);
    expect(top).not.toMatch(/pages: write|id-token: write/);
  });

  test("grants pages: write and id-token: write to the deploy job only", () => {
    const deploy = job(workflow, "deploy");
    expect(deploy).toMatch(/permissions:\s*\n {6}pages: write\s*\n {6}id-token: write\s*(\n|$)/);
    expect(job(workflow, "site")).not.toMatch(/pages: write|id-token: write/);
  });

  test("deploys only from main, even when started by hand from another branch", () => {
    expect(job(workflow, "deploy")).toMatch(/^ {4}if: github\.ref == 'refs\/heads\/main'\s*$/m);
  });

  test("uses a concurrency group that lets a running deploy finish", () => {
    expect(workflow).toMatch(
      /^concurrency:\s*\n {2}group: pages\s*\n {2}cancel-in-progress: false\s*$/m,
    );
  });

  test("builds with the npm scripts CI uses: npm ci, then npm run build", () => {
    const ci = read(".github/workflows/ci.yml");
    const site = job(workflow, "site");
    expect(ci).toContain("run: npm ci");
    expect(site).toContain("run: npm ci");
    expect(ci).toContain("npm run build"); // CI builds through test:e2e, which runs npm run build
    expect(read("package.json")).toMatch(/"test:e2e": "npm run build && playwright test"/);
    expect(site).toMatch(/run: npm run build\s*$/m);
  });

  test("uses Node.js and checkout as CI does", () => {
    const ci = read(".github/workflows/ci.yml");
    const site = job(workflow, "site");
    for (const line of ["actions/checkout@v7", "actions/setup-node@v7", 'node-version: "24"']) {
      expect(ci).toContain(line);
      expect(site).toContain(line);
    }
  });

  test("uploads dist/ with the official Pages actions, pinned to a major version", () => {
    const site = job(workflow, "site");
    expect(site).toMatch(/uses: actions\/configure-pages@v\d+/);
    expect(site).toMatch(
      /uses: actions\/upload-pages-artifact@v\d+\s*\n\s+with:\s*\n\s+path: dist\s*$/m,
    );
    expect(job(workflow, "deploy")).toMatch(/uses: actions\/deploy-pages@v\d+/);
  });

  test("deploys after the build job and to the github-pages environment", () => {
    const deploy = job(workflow, "deploy");
    expect(deploy).toMatch(/needs: site/);
    expect(deploy).toMatch(/environment:\s*\n\s+name: github-pages/);
  });

  test("leaves the required build check alone: no job here is named build", () => {
    expect(workflow).not.toMatch(/^ {2}build:\s*$/m);
    expect(workflow).not.toMatch(/^\s+name: build\s*$/m);
  });
});

// Structure tests of .github/workflows/crog-review.yml: the safety properties
// of the workflow (PO-68 pilot) are asserted, not just described.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

const path = fileURLToPath(new URL("../../workflows/crog-review.yml", import.meta.url));
const raw = readFileSync(path, "utf8");
const wf = parse(raw);
// The workflow without its comments: the checks look at what runs, not at prose.
const code = raw
  .split("\n")
  .map((line) => line.replace(/(^|\s)#.*$/, ""))
  .join("\n");
const job = Object.values(wf.jobs)[0];

test("runs on pull_request with the four types asked for, and never pull_request_target", () => {
  assert.deepEqual(Object.keys(wf.on), ["pull_request"]);
  assert.deepEqual([...wf.on.pull_request.types].sort(), [
    "edited",
    "opened",
    "ready_for_review",
    "synchronize",
  ]);
  assert.ok(!/pull_request_target/.test(code));
});

test("skips [claim] PRs, drafts and fork PRs", () => {
  const cond = String(job.if);
  assert.match(cond, /startsWith\(github\.event\.pull_request\.title, '\[claim\]'\)/);
  assert.match(cond, /!startsWith/);
  assert.match(cond, /draft == false/);
  assert.match(cond, /head\.repo\.full_name == github\.repository/);
});

test("permissions: read code, write PR comments, nothing else", () => {
  assert.deepEqual(wf.permissions, { contents: "read", "pull-requests": "write" });
  assert.equal(job.permissions, undefined);
});

test("one review per PR at a time", () => {
  assert.match(wf.concurrency.group, /pull_request\.number/);
  assert.equal(wf.concurrency["cancel-in-progress"], true);
});

test("does not use the Claude Code GitHub Action, and never merges, approves or pushes", () => {
  assert.ok(!/claude-code-action/.test(code));
  assert.ok(
    !/gh pr merge|pulls\/[^\s]*\/merge|\/reviews|gh pr review|git push|enable_pr_auto_merge/.test(
      code,
    ),
  );
  assert.ok(!/--auto|auto-merge/.test(code));
});

test("the secret reaches the script step only, and the script is the one in the repo", () => {
  const steps = job.steps;
  const withKey = steps.filter((s) => JSON.stringify(s.env ?? {}).includes("ANTHROPIC_API_KEY"));
  assert.equal(withKey.length, 1);
  assert.match(withKey[0].run, /\.github\/reviewer\/review\.mjs/);
  assert.equal(code.match(/secrets\.ANTHROPIC_API_KEY/g).length, 1);
});

test("checkout keeps no credentials and has the base commit; installs from the lockfile without scripts", () => {
  const checkout = job.steps.find((s) => String(s.uses).startsWith("actions/checkout@"));
  assert.equal(checkout.with["persist-credentials"], false);
  assert.equal(checkout.with["fetch-depth"], 0);
  const install = job.steps.find((s) => /npm ci/.test(String(s.run)));
  assert.match(install.run, /--ignore-scripts/);
  assert.match(install.run, /\.github\/reviewer/);
});

test("the job has a time limit", () => {
  assert.ok(Number.isInteger(job["timeout-minutes"]) && job["timeout-minutes"] <= 20);
});

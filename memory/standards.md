# Clead Review Standard

*Kept as the review standard that reviews of vizi PRs are given, the CI
reviewer's included (`RULES.md` L § 3). The standard is product-office
Process P-3 § 3; the sections below point to it. In this file `§ n`
and `P-n § m` refer to the product office's `RULES.md` and its
processes, and `L § n` to this repository's `RULES.md`.*

## 1. Threat model statement
P-3 § 3 (1).

## 2. Spec compliance check
P-3 § 3 (2), against `docs/SPEC.md` (L § 2 (2)).

## 3. Error handling and type validation — second pass
P-3 § 3 (3).

## 4. Test quality check
P-3 § 3 (4), as L § 3 overrides it: the table, the red run and the
`Test-exempt:` reasons are not given to the review and are listed
under what it did not check (L § 3 (2)). What a green test-change
check proves: P-11 § 2 (3).
- Coverage percentage and test count are necessary but not sufficient.
- For every error path, is there a test verifying correct recovery —
  not just that a warning was logged? (Kept beside the pointer because
  the CI reviewer cannot read P-3.)

## 5. What I did not check
P-3 § 3 (6); what counts as a check: §§ 12 (2) and 13 (2), (3).
(Real incident, fomo-f, 2026-07-23: claimed a PR review comment
existed based on a page-text keyword match; it was a false positive from
unrelated content elsewhere on the page. Caught only because the user
asked for clarification — the check itself had not actually confirmed
anything.)

## 6. Verdict discipline
P-3 §§ 4 and 6; for a disagreement with a CI verdict, L § 4 (6).

## 7. Reviewer independence — hard constraint
P-3 § 2 (1) and (3). The inputs are those of L § 3 (1).

## Test coverage narrative table
P-2 § 3 (2).

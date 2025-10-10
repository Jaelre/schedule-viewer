---
name: "🐛 Bug Fix (Incident Recovery)"
about: "Capture context, impact, and remediation plan for a discovered bug"
title: "[Bug] "
labels: ["bug", "needs-triage"]
assignees: ""
---

## Summary
<!-- One or two sentences describing the bug. Include signal (alert, customer report, etc.). -->

## Impact
- **Affected users / tenants:**
- **Severity:** <!-- blocker | high | medium | low -->
- **First observed:**

## Environment
<!-- e.g. Production, Staging, Local. Include versions/build hashes if relevant. -->

## Steps to Reproduce
1. 
2. 
3. 

## Expected vs Actual
- **Expected:**
- **Actual:**

## Root Cause Notes
<!-- Hypothesis or confirmed root cause. Link to logs, traces, or SQL snapshots. -->

## Fix Plan
- [ ] Reproduce locally or with automated test
- [ ] Add failing test (unit/integration/e2e)
- [ ] Implement fix (DB → API → UI as needed)
- [ ] Backfill data / run migrations (if required)
- [ ] Update documentation / runbook
- [ ] Regression tests added or updated

## Validation
<!-- Outline how the fix will be validated (test steps, feature flags, monitoring). -->

## Follow-up Tasks
<!-- Additional clean-up, postmortem, or hardening work. Create linked issues if needed. -->

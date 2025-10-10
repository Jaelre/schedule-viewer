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
- [ ] Reproduce locally or capture a failing automated test
- [ ] Add/extend automated coverage (Vitest/Jest) or document manual QA
- [ ] Implement fix in `src/app`, `src/lib`, or `worker/` (note cross-cutting impacts)
- [ ] Update JSON config (`doctor-names.json`, `shift-colors.json`) if affected
- [ ] Refresh documentation (`AGENTS.md`, `README.md`, `docs/`) where behavior changed
- [ ] Capture regression coverage (test or manual steps)

## Validation
<!-- List commands run, e.g. `npm run lint`, `npm run build`, `npx wrangler dev`, and manual QA results. -->

## Follow-up Tasks
<!-- Additional clean-up, postmortem, or hardening work. Create linked issues if needed. -->

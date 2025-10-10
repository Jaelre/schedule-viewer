---
name: 🚀 Feature Request (Vertical Slice)
about: Plan new features as thin end-to-end slices
title: "[Feature] "
labels: ["feature"]
assignees: ""
---

## User Story
_As a [role] I want [goal] so that [benefit]._  

## Scope (End-to-End Slice)
- Ships a demoable update in the schedule viewer UI
- Accounts for Worker/API, frontend, and JSON config impacts

## Description
<!-- Short description of what this feature should do. -->

## Implementation Areas
- [ ] Frontend (`src/app`, `src/lib`)
- [ ] Worker (`worker/src`)
- [ ] Data/Config (`doctor-names.json`, `shift-colors.json`)
- [ ] Docs / Guides (`AGENTS.md`, `docs/`, `claudedocs/`)

## Acceptance Criteria (Definition of Done)
- [ ] Worker/API contracts updated and documented (if applicable)
- [ ] UI handles loading, error, and empty states for the new flow
- [ ] Lint/build/test scripts pass (`npm run lint`, `npm run build`, worker checks)
- [ ] Automated or manual regression coverage captured
- [ ] Docs/ADR updated with notable decisions
- [ ] Demo URL or screenshots attached

## Out of Scope
<!-- Explicitly list what is NOT part of this issue (helps fight scope creep). -->

## Additional Notes
<!-- Links to designs, ADRs, references, or exploration notes. -->

---
**Labels:**  
- Add `exploration` if this is a spike (time-boxed)  
- Add `not-this-sprint` if deferred

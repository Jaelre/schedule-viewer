---
name: 🚀 Feature Request (Vertical Slice)
about: Plan new features as thin end-to-end slices
title: "[Feature] "
labels: ["feature"]
assignees: ""
---

## User Story
_As a [role] I want [goal] so that [benefit]._  

## Scope (Vertical Slice)
- Covers **DB → API → UI** in one issue
- Must result in a **demoable outcome in the browser**

## Description
<!-- Short description of what this feature should do. -->

## Acceptance Criteria (Definition of Done)
- [ ] Migration/schema updated (if needed)
- [ ] DTO / contract updated and regenerated (Rust + TS)
- [ ] Golden sample test updated/added
- [ ] API endpoint created/extended
- [ ] UI renders new data (handles loading/error/empty)
- [ ] Documentation/ADR updated
- [ ] Demo branch shows working vertical

## Out of Scope
<!-- Explicitly list what is NOT part of this issue (helps fight scope creep). -->

## Additional Notes
<!-- Links to designs, ADRs, references, or exploration notes. -->

---
**Labels:**  
- Add `exploration` if this is a spike (time-boxed)  
- Add `not-this-sprint` if deferred

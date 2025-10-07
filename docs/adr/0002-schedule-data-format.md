# ADR 0002: Store schedule content as Markdown-enhanced YAML

## Status
Accepted

## Context
Event sessions include structured fields such as time and room, but also
need rich text descriptions. Content editors should be able to make quick
changes in version control without a custom CMS. A pure JSON structure is
difficult to review, whereas Markdown alone cannot express start times or
filters.

## Decision
We will author schedule data in YAML files with embedded Markdown for the
descriptive fields. Each session entry will include typed keys (id,
start, end, speakers, tags) alongside a `details` field rendered from
Markdown. Build tooling will convert the YAML to typed TypeScript objects
at compile time.

## Consequences
* Editors can update schedules using any text editor, with YAML providing
  clear key/value semantics and Markdown preserving formatting.
* The repository history reflects content changes, enabling meaningful
  code reviews.
* We must validate YAML structure during CI to prevent malformed files,
  and we accept the risk of indentation errors inherent to YAML.

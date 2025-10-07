# ADR 0001: Choose Next.js and TypeScript for the Schedule Viewer

## Status
Accepted

## Context
The schedule viewer should feel like a modern web application with fast
navigation, client-side interactivity, and the ability to statically
pre-render recurring event data. We need a framework that is popular,
well-documented, and supports hybrid static and server rendering so that
we can ship quickly while keeping the door open for future integrations.

## Decision
We will build the web client with Next.js using TypeScript. Next.js gives
us an opinionated React runtime with file-system routing, API routes for
lightweight back-end needs, and an ecosystem of examples and deployment
options. TypeScript provides static type checking to document data shapes
and catch regressions early.

## Consequences
* We can render the schedule statically and hydrate interactive widgets
  on the client without writing custom tooling.
* Team members familiar with React can contribute immediately, reducing
  onboarding time.
* We accept the build tooling that comes with Next.js (Webpack and
  SWC). Migrating to a different stack later would require rewriting the
  routing and data-loading code.

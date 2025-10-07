# ADR 0004: Deploy the schedule viewer with static exports on Vercel

## Status
Accepted

## Context
The project should be easy to host with minimal operational overhead. The
schedule is mostly static, with updates happening through Git pushes.
Continuous delivery and preview environments are important for reviewing
content updates with stakeholders.

## Decision
We will deploy the application using Next.js static exports hosted on
Vercel. Each commit to the default branch will trigger a build that
produces a static site. Pull requests receive preview deployments so
stakeholders can verify schedule changes before merging.

## Consequences
* Hosting costs remain low because the output is a collection of static
  assets served by Vercel's CDN.
* Build times become part of the content editing workflow; large data sets
  may increase publication latency.
* Any future server-side functionality will require moving to hybrid
  rendering or an auxiliary service because pure static exports cannot
  execute server code.

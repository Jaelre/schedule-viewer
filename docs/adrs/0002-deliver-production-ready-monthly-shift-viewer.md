# ADR 0002: Deliver Production-Ready Monthly Shift Viewer

- Status: Accepted
- Date: 2025-02-14

## Context
- The engagement required a fully functional monthly shift viewer aligned with the provided product instructions and architecture direction.
- Success criteria covered performant rendering, strong accessibility, deterministic styling, and safe integration with the MetricAid API via the Worker proxy.
- Documentation and project structure needed to reflect a deployable solution that new contributors could understand quickly.

## Decision
We completed the application as a production-ready deliverable, implementing the full Next.js frontend, Rust Worker backend, and developer documentation. Core elements include:
- TypeScript domain contracts (`lib/types.ts`), date utilities with Italian holidays, deterministic colour utilities, and an API client that encapsulates React Query hooks.
- UI components for month navigation, density toggling, the shift legend, and the virtualised schedule grid, wired together through `app/page.tsx` and a shared provider setup.
- A mock `/api/shifts` route for local development alongside the Rust Worker that performs validation, transformation, caching, CORS, retries, and timeout management.
- Comprehensive documentation in `README.md` alongside these ADRs to guide setup, deployment, and future enhancements.

## Consequences
- **Feature Completeness**: The solution satisfies month navigation, shift rendering, error handling, localisation, and performance expectations out of the box, verified through local dev and build workflows.
- **Operational Readiness**: Environment variables, build commands, and deployment steps are fully documented, enabling Cloudflare Pages + Workers deployments without additional discovery work.
- **Extensibility**: Normalised data structures (`people`, `rows`, `codes`) and deterministic styling primitives simplify future additions such as unit routing or exports, though major extensions (filters, exports) remain future work.
- **Maintenance Visibility**: Known trade-offs and follow-up tasks (e.g., unit routing TODO, V2 enhancements) are explicitly captured, providing a roadmap for subsequent iterations.

## Reference Checklist
- Performance techniques: React Query caching, row virtualisation, memoised cells, and background refreshes.
- Accessibility coverage: semantic HTML, ARIA labelling, keyboard navigation, WCAG AA colour contrast.
- Testing guidance: `npm install`, `npm run dev`, and `npm run build` workflows validated; Worker deployment steps via `wrangler` documented.

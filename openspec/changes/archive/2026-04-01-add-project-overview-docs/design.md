## Context

ScholarsPass already implements the core transport lifecycle, administrative tooling, and supporting modules such as notices, complaints, files, and payments. However, the system description currently lives across Prisma schema files, API handlers, dashboard pages, and helper utilities. For project defense and technical handoff, this knowledge needs to be reorganized into a documentation set that is accurate to the codebase and easy to navigate.

The documentation should reflect actual implementation details rather than idealized architecture. In particular, it must preserve business truths such as student-only payments, computed pass activation, role-based administration, and the distinction between stored database states and derived business states.

## Goals / Non-Goals

**Goals:**
- Create a root-level `.overview/` folder with topic-specific markdown documents.
- Separate content so each file can be reused independently for viva, report writing, and presentation assets.
- Keep the documentation aligned with the explored codebase, including APIs, schema, flows, and external integrations.
- Capture the documentation structure in OpenSpec so the repository has a formal record of the change.

**Non-Goals:**
- Refactor runtime code or APIs.
- Introduce new product features.
- Replace README as the primary quick-start guide.
- Generate binary diagrams or presentation slides automatically.

## Decisions

### Decision: Use a dedicated `.overview/` root folder
The documentation will live in `.overview/` rather than inside `openspec/` or `docs/` so it is easy to find, clearly separate from change-management artifacts, and suitable for project-defense deliverables.

Alternative considered:
- Store the content only in OpenSpec artifacts.
Why not chosen:
- OpenSpec artifacts are change-oriented and not ideal as the primary reusable documentation bundle for viva and report use.

### Decision: Split content into individual markdown files by topic
Instead of a single large report file, the documentation will be divided into focused files such as system overview, API reference, flows, schema, diagrams, and sample data.

Alternative considered:
- One monolithic overview file.
Why not chosen:
- Harder to reuse in slides, harder to update, and more difficult to navigate during defense preparation.

### Decision: Preserve implementation truths even when they differ from common academic assumptions
The docs will explicitly note that ScholarsPass does not store a standalone pass table and that states like `ACTIVE` and `PAYMENT_PENDING` are derived business states rather than Prisma enums.

Alternative considered:
- Normalize the explanation into a more generic “ideal” transport-pass model.
Why not chosen:
- This would create mismatch between documentation and the real system, which is risky in a viva or code review setting.

### Decision: Include both repository-level documentation and OpenSpec artifacts
The `.overview/` folder will serve end users of the documentation, while OpenSpec artifacts will formally describe the change and its intent.

Alternative considered:
- Create only the `.overview/` folder.
Why not chosen:
- The user explicitly invoked the OpenSpec proposal workflow, so the change should also be represented in OpenSpec.

## Risks / Trade-offs

- [Documentation drift] -> Keep the docs descriptive of current implementation and avoid inventing future features.
- [Redundant content across files] -> Use an index file plus topic-specific files with clear scope boundaries.
- [Academic wording overstating implementation] -> Repeatedly call out derived states, inferred pass behavior, and route-handler boundaries where needed.
- [Large documentation bundle becoming difficult to maintain] -> Keep each file focused and limited to one major subject area.

## Context

The repository currently presents two different product identities. OpenSpec configuration already refers to the system as `ScholarsPass`, while the application UI, metadata, email/SMS messaging, and some assets still use `Scholars Transit Hub`. The rename touches multiple modules, but it is still primarily a content and branding alignment change rather than a platform migration.

The codebase also contains internal identifiers tied to the older name, including repository naming, package naming, and Cloudinary folder paths such as `scholars-transit/...`. Those identifiers may have operational history or external dependencies, so changing them as part of the same effort would increase risk.

## Goals / Non-Goals

**Goals:**
- Establish `ScholarsPass` as the canonical user-facing product name.
- Ensure browser metadata, shared UI elements, emails, SMS messages, and admin-triggered notifications present the same brand.
- Make the rebrand scope explicit so implementation can proceed without accidental expansion into storage or infrastructure migration.
- Preserve accessibility by keeping logo alt text and other descriptive text aligned with the visible brand.

**Non-Goals:**
- Renaming repository folders, package names, database records, or environment variable names.
- Migrating Cloudinary storage folders or other persisted asset paths in the same change.
- Redesigning the visual identity beyond the minimum asset updates needed for the new wordmark.
- Changing business logic, auth flows, or transport application workflows.

## Decisions

### Decision: Treat this as a user-facing rebrand, not a full system rename
The change will update all user-visible product naming and leave internal identifiers unchanged unless a later proposal explicitly expands scope.

Why:
- This resolves the current branding inconsistency quickly.
- It avoids breaking integrations or orphaning existing uploaded assets.

Alternative considered:
- Full rename of storage paths, repository identifiers, and package metadata in the same change. Rejected because it adds migration risk without changing user experience.

### Decision: Centralize the rename around shared touchpoints first
Implementation should prioritize shared surfaces such as root metadata, shared logo usage, email helpers, auth messaging, and admin-triggered notices before isolated pages.

Why:
- These touchpoints propagate across the app and eliminate the most visible inconsistency with the fewest changes.
- It reduces the chance of partial branding updates.

Alternative considered:
- Rename pages opportunistically as they are encountered. Rejected because it makes omissions likely.

### Decision: Update brand assets only where the old wordmark is embedded
Text-only references can be updated directly in code, while SVG or raster logo assets should be replaced only if they visibly encode the old brand name.

Why:
- This separates copy changes from asset work.
- It acknowledges that visual assets may require design verification rather than string replacement.

Alternative considered:
- Reuse existing assets unchanged. Rejected because the embedded wordmark would preserve the old brand in high-visibility locations.

## Risks / Trade-offs

- [Old branding remains in an overlooked template or route] -> Mitigation: audit shared metadata, auth flows, email/SMS templates, admin notification routes, and documentation before implementation.
- [Internal identifiers are mistaken for required rename targets] -> Mitigation: document them as out of scope in specs and tasks unless separately approved.
- [Logo files still show the old wordmark after copy updates land] -> Mitigation: treat logo assets as an explicit implementation task with manual verification.
- [Third-party sender address branding remains inconsistent] -> Mitigation: update sender display names now, and defer domain-level email branding changes unless operational ownership is confirmed.

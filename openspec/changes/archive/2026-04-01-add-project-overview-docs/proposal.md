## Why

ScholarsPass now has enough implemented functionality that project knowledge needs to be captured in a stable, reusable format for report writing, slide preparation, viva defense, and onboarding. The current knowledge exists only across source files and ad hoc exploration notes, which makes it hard to reuse consistently and increases the risk of presenting incorrect system details.

## What Changes

- Add a dedicated `.overview/` folder at the project root for curated project documentation.
- Organize explored system knowledge into separate markdown files by topic, including architecture, APIs, flows, database design, payments, sample data, and viva notes.
- Capture the same documentation intent in OpenSpec artifacts so the documentation structure is tracked as a formal project change.
- Document important implementation truths clearly, including that pass state is computed and not stored in a standalone `Pass` table.

## Capabilities

### New Capabilities
- `project-overview-docs`: Provide a structured, codebase-aligned documentation bundle that explains the implemented ScholarsPass system for academic and operational use.

### Modified Capabilities
- None.

## Impact

- Adds new repository documentation under `.overview/`
- Adds OpenSpec artifacts under `openspec/changes/add-project-overview-docs/`
- Does not change runtime behavior, APIs, database schema, or dependencies

## ADDED Requirements

### Requirement: Repository overview bundle
The repository SHALL provide a dedicated `.overview/` folder containing topic-specific markdown files that summarize the implemented ScholarsPass system for documentation and presentation use.

#### Scenario: Overview folder exists
- **WHEN** a maintainer inspects the project root
- **THEN** the repository SHALL include a `.overview/` directory for curated project documentation

### Requirement: Documentation SHALL reflect implemented behavior
Each overview document SHALL describe actual ScholarsPass behavior found in the current codebase and SHALL avoid presenting unimplemented features as completed functionality.

#### Scenario: Pass model is described
- **WHEN** the documentation explains transport pass storage or activation
- **THEN** it SHALL state that pass state is computed from application and payment data and not stored in a standalone `Pass` table

### Requirement: Documentation SHALL separate major system concerns
The overview bundle SHALL organize information into separate markdown files for major concerns such as system summary, architecture, APIs, flows, database design, payments, diagrams, sample data, and report-ready content.

#### Scenario: A reader needs API information
- **WHEN** a reader looks for endpoint details
- **THEN** the overview bundle SHALL provide a dedicated API-focused markdown file instead of requiring the reader to search a generic notes document

### Requirement: Documentation SHALL support academic defense preparation
The overview bundle SHALL include content that can be reused directly for report writing, diagram rendering, slide preparation, and viva clarification.

#### Scenario: A student prepares for viva
- **WHEN** the student reviews the overview bundle
- **THEN** the documentation SHALL include concise clarification notes about real system constraints, roles, states, and implementation boundaries

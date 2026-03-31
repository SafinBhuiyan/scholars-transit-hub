# ScholarsPass Overview Bundle

This folder collects the explored project knowledge for ScholarsPass in separate markdown files so the information is easy to reuse for:

- final year report writing
- viva preparation
- slide preparation
- diagram generation
- team onboarding

## Files

- `01-system-summary.md`: high-level description of the implemented system
- `02-architecture.md`: architecture, modules, and external service integration
- `03-auth-and-roles.md`: authentication flow, user roles, and authorization model
- `04-api-surface.md`: route-handler API inventory and grouped endpoint notes
- `05-user-flows.md`: student, staff, and admin action flows with real states
- `06-database-schema.md`: actual Prisma models, enums, and relationship notes
- `07-payments-and-pass-logic.md`: payment workflow and computed pass behavior
- `08-diagrams.md`: Mermaid diagrams for architecture, sequence, flow, and ERD
- `09-sample-data.md`: realistic records for slides, demos, and diagram labels
- `10-project-report.md`: report-ready academic narrative
- `11-viva-notes.md`: concise clarifications for defense questions

## Important Truths

- There is no standalone `Pass` table in the Prisma schema.
- `WAITLIST`, `APPROVED`, and `REJECTED` are stored application states.
- `PAYMENT_PENDING` and `ACTIVE` are useful business states for explanation, but they are derived from application and payment conditions.
- Only student applicants require payment.

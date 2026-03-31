## Why

The project is already described as `ScholarsPass` in OpenSpec, but the live application and supporting messages still present the older `Scholars Transit Hub` brand. This mismatch creates confusion across the product surface and makes the product identity feel unfinished.

## What Changes

- Rename the user-facing product name from `Scholars Transit Hub` to `ScholarsPass` across the website, app metadata, auth flows, email copy, SMS copy, and admin-triggered notifications.
- Align shared brand assets and accessible text so logos and email templates reflect the `ScholarsPass` name.
- Define the intended scope of the rebrand so internal identifiers such as storage folders, repository names, and package names are explicitly treated as out of scope unless separately approved.
- Update project-facing documentation to use the new product name consistently.

## Capabilities

### New Capabilities
- `product-branding`: Defines how the product name and brand text must appear across user-facing surfaces and supporting communications.

### Modified Capabilities
- None.

## Impact

- Affected code includes app metadata, shared logo usage, auth/email/SMS messaging, admin notification routes, and documentation.
- No API contract or database schema changes are expected.
- Design work may be required for logo asset updates if the existing SVG and email logo artwork contains the old wordmark.

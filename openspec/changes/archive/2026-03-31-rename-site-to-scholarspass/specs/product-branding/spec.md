## ADDED Requirements

### Requirement: User-facing product name consistency
The system SHALL present `ScholarsPass` as the canonical product name across all user-facing application surfaces where the product name is displayed.

#### Scenario: Browser metadata uses the canonical name
- **WHEN** the application renders metadata such as the page title or other product-identifying browser text
- **THEN** the displayed product name MUST be `ScholarsPass`

#### Scenario: Shared UI branding uses the canonical name
- **WHEN** a shared UI component renders product-identifying text such as logo alt text or other brand labels
- **THEN** the text MUST use `ScholarsPass`

### Requirement: Operational messages use the canonical brand
The system SHALL use `ScholarsPass` in user-facing operational communications, including authentication messages, email templates, SMS messages, and admin-triggered notifications.

#### Scenario: Authentication communication uses the canonical name
- **WHEN** the system sends password reset, verification, or OTP-related content
- **THEN** the message content MUST identify the product as `ScholarsPass`

#### Scenario: Admin-triggered communication uses the canonical name
- **WHEN** the system sends approval, payment, role, complaint, or other administrative notifications to users
- **THEN** the subject lines, body copy, and sender display name MUST identify the product as `ScholarsPass`

### Requirement: Internal legacy identifiers remain unchanged unless explicitly expanded
The system SHALL preserve existing internal identifiers that are not user-facing, including storage paths and similar operational names, unless a later approved change explicitly expands the rebrand scope.

#### Scenario: Storage identifiers remain stable during the rebrand
- **WHEN** implementation updates branding for this change
- **THEN** existing storage folder names and other non-user-facing identifiers MUST NOT be renamed as part of this change by default

### Requirement: Brand assets must not contradict the canonical name
The system SHALL ensure that high-visibility brand assets do not display the old `Scholars Transit Hub` wordmark once the rebrand is complete.

#### Scenario: Embedded logo wordmark is aligned
- **WHEN** a logo or email asset includes embedded product text
- **THEN** the rendered wordmark MUST display `ScholarsPass` instead of `Scholars Transit Hub`

Frontend


Description

FE-WEB-2.1 — Public Treatment Package Discovery
Implement the Website treatment package discovery experience so that an unauthenticated visitor/patient can:

Access treatment package discovery without logging in.

View available treatment packages.

Select a treatment package.

Ensure login is not required for browsing or viewing the available packages.

Show appropriate loading, empty, error, and unavailable states where applicable.

Display only treatment packages permitted for public discovery according to the story.

Covers: AC-1, empty/error/unavailable edge cases, Visitor permission.

FE-WEB-2.2 — Treatment Package Details
Implement the Website treatment package details view so that:

A visitor can select a treatment package.

Approved package details are displayed without authentication.

The visitor can understand/evaluate the selected treatment package.

A Book / Proceed to Booking action is available as specified by the story.

Missing package information is handled appropriately.

If the selected package becomes unavailable while viewing it, the appropriate unavailable state is shown.

Covers: AC-2, treatment package requirements, missing profile/information and unavailable-record edge cases.

FE-WEB-2.3 — Public Hospital Discovery and Listing
Implement the Website hospital discovery/listing experience so that:

An unauthenticated visitor can access hospital discovery.

Hospital listings are displayed without requiring login.

A visitor can select a hospital.

Only permitted/approved hospital information is displayed.

Appropriate loading, empty, error, and unavailable states are handled.

Covers: AC-3, hospital discovery requirements, Visitor permission.

FE-WEB-2.4 — Hospital Search
Implement hospital search on the Website so that:

A visitor can search for hospitals without authentication.

When matching hospital records exist, the matching hospitals are displayed.

When there are no matching hospitals, an appropriate empty-results state is displayed.

Search works as part of the public hospital discovery experience.

Covers: AC-4 and the no-search-results edge case.

Important: The story does not confirm additional hospital filters, so this subtask does not add filters.

FE-WEB-2.5 — Hospital Details/Profile
Implement the Website hospital details/profile view so that:

A visitor can select a hospital from discovery.

The selected hospital's approved profile information is displayed.

The profile can be viewed without authentication.

Missing profile information is handled appropriately.

If the hospital becomes unavailable, the appropriate unavailable state is displayed.

Covers: AC-7, hospital profile requirement, missing-information/unavailable-record edge cases.

FE-WEB-2.6 — Public Doctor Discovery and Listing
Implement the Website doctor discovery/listing experience so that:

An unauthenticated visitor can access doctor discovery.

Doctor listings are displayed without login.

A visitor can select a doctor.

Only permitted/approved doctor information is displayed.

Appropriate loading, empty, error, and unavailable states are handled.

Covers: AC-5 and Visitor permission.

FE-WEB-2.7 — Doctor Search
Implement doctor search on the Website so that:

A visitor can search for doctors without authentication.

Matching doctor records are displayed when available.

An appropriate empty-results state is displayed when there are no matching doctors.

Search works as part of the public doctor discovery experience.

Covers: AC-6 and the no-search-results edge case.

Important: The story does not confirm additional doctor filters, so no filters are added here.

FE-WEB-2.8 — Doctor Details/Profile
Implement the Website doctor details/profile view so that:

A visitor can select a doctor from discovery.

The selected doctor's approved profile information is displayed.

The profile can be viewed without authentication.

Missing profile information is handled appropriately.

If the doctor becomes unavailable, the appropriate unavailable state is displayed.

Covers: AC-7, doctor profile requirement, missing-information/unavailable-record edge cases.

FE-WEB-2.9 — Book Appointment Authentication Handoff
Implement the Website behavior when a user selects Book Appointment or the equivalent booking action.

For an authenticated patient:

Allow the user to proceed into the booking journey.

For an unauthenticated visitor:

Do not allow direct entry into protected booking functionality.

Redirect the visitor to Login / Sign Up.

Clearly handle the transition from public discovery to the protected booking journey.

Provide the appropriate login/sign-up redirect feedback.

Covers: AC-8, AC-9, Booking Entry, authentication business rules.

FE-WEB-2.10 — Continue Booking After Authentication
Implement the Website flow for an unauthenticated visitor who attempts to book:

Visitor discovers a treatment package/hospital/doctor.

Visitor selects the booking action.

Visitor is redirected to Login / Sign Up.

Visitor successfully authenticates.

Visitor can continue into the booking journey.

Also handle:

Authentication failure.

Visitor cancelling Login / Sign Up.

Covers: AC-10 and the authentication-failure/cancelled-authentication edge cases.

FE-WEB-2.11 — Preserve Discovery Context During Authentication
Implement the Website behavior required to retain the selected discovery context when a visitor is redirected to authentication.

Where applicable, retain the context selected before authentication, including:

Treatment package

Hospital

Department

Doctor

After successful authentication:

The user should be able to continue booking with the applicable selected context.

The user should not have to unnecessarily repeat discovery selections.

If the selected discovery context cannot be retained after authentication, handle that situation appropriately.

Covers: AC-11 and the context-retention edge case.

FE-WEB-2.12 — Discovery Loading, Empty, Error and Unavailable States
Implement the Website user feedback states required across treatment packages, hospitals, doctors, and profiles:

Loading state

Empty state

Empty search-results state

Error state

Unavailable state

Handle the specific cases described in the story:

No treatment packages

No hospitals

No doctors

No search results

Backend unavailable

Missing profile information

Discovery record becomes unavailable while viewing

Selected discovery record becomes unavailable before booking starts

Covers: Notifications/User Feedback and all applicable discovery edge cases.

FE-WEB-2.13 — Public Discovery Access and Protected Booking Boundary
Ensure the Website maintains the access boundary defined by the story:

Without authentication:

View treatment packages.

View treatment package details.

View hospitals.

Search hospitals.

View hospital profiles.

View doctors.

Search doctors.

View doctor profiles.

Authentication required:

Enter protected booking functionality.

Complete booking.

Visitor must not:

Access patient-specific information.

Complete booking without authentication.

Covers: Permissions, Business Rules, Shared Data requirements.

Backend


Description

BE-2.1 — Support Public Treatment Package Discovery
Description

Implement backend support for public treatment package discovery.

Requirements:

Treatment packages must be discoverable without authentication.

Visitor/Patient must be able to retrieve available treatment packages.

Public discovery must not require a patient session.

Only approved/published treatment packages should be shown.

Inactive records must follow the approved visibility rule.

No additional visibility rule should be introduced unless already defined elsewhere.

Support the empty-result case when no treatment packages are available.

Support the backend error case.

Story coverage: AC-1, AC-12, Business Rules, Shared Data.

BE-2.2 — Support Public Treatment Package Details
Description

Implement backend support for viewing an individual treatment package.

Requirements:

A visitor/patient must be able to retrieve an approved treatment package's details without authentication.

Only approved package information should be exposed.

Patient-specific information must not be exposed through public discovery.

Handle a package that does not exist.

Handle a package that becomes unavailable.

Support the appropriate unavailable/error response needed by the client.

Story coverage: AC-2, Edge Cases, Business Rules.

BE-2.3 — Support Public Hospital Discovery
Description

Implement backend support for hospital discovery.

Requirements:

Hospital listings must be publicly accessible.

Authentication must not be required for hospital discovery.

Only permitted/approved hospital records should be displayed.

Inactive records must follow the approved visibility rule.

Support the empty hospital result case.

Support backend errors.

Story coverage: AC-3, AC-12, Business Rules.

BE-2.4 — Support Hospital Search
Description

Implement backend support for searching hospitals.

Requirements:

An unauthenticated visitor/patient must be able to search hospitals.

Matching hospitals must be returned when matching records exist.

No-match searches must be handled.

Search requirements that are marked TBD in the story must remain TBD.

Do not introduce additional search filters or search rules that are not confirmed in the story.

Story coverage: AC-4, Dependencies — Search, Business Rules.

BE-2.5 — Support Public Hospital Profile
Description

Implement backend support for viewing a hospital's approved profile information.

Requirements:

Hospital profile information must be publicly accessible.

Authentication must not be required.

Only approved profile information should be returned.

Patient-specific information must not be exposed.

Handle missing profile information.

Handle a hospital becoming unavailable while it is being viewed.

Story coverage: AC-7, Edge Cases, Permissions.

BE-2.6 — Support Public Doctor Discovery
Description

Implement backend support for doctor discovery.

Requirements:

Doctor listings must be publicly accessible.

Authentication must not be required.

Only permitted/approved doctor records should be displayed.

Inactive records must follow the approved visibility rule.

Support the empty doctor result case.

Support backend errors.

Story coverage: AC-5, AC-12, Business Rules.

BE-2.7 — Support Doctor Search
Description

Implement backend support for searching doctors.

Requirements:

An unauthenticated visitor/patient must be able to search doctors.

Matching doctors must be returned when matching records exist.

No-match searches must be handled.

Search/filter requirements that are not confirmed in the story must remain TBD.

Do not introduce additional search/filter rules.

Story coverage: AC-6, Dependencies — Search, Business Rules.

BE-2.8 — Support Public Doctor Profile
Description

Implement backend support for viewing an approved doctor's profile.

Requirements:

Doctor profile information must be publicly accessible.

Authentication must not be required.

Only approved profile information should be returned.

Patient-specific information must not be exposed.

Handle missing profile information.

Handle a doctor becoming unavailable while being viewed.

Story coverage: AC-7, Edge Cases, Permissions.

BE-2.9 — Apply Public Discovery Visibility Rules
Description

Apply the visibility requirements defined in Story 2 to public discovery information.

Requirements:

Only approved/published records should be shown.

Apply the approved visibility rule for inactive records.

Apply the rules to:

Treatment packages

Hospitals

Doctors

Discovery must remain available without authentication.

Do not create a new rule for inactive records because the story does not define the exact behavior.

Story coverage: Business Rules.

BE-2.10 — Support Shared Discovery Data for Website and Mobile
Description

Ensure the backend supports the shared discovery data required by both Website and Mobile.

Requirements:

Mobile and Website must consume the shared backend.

Approved healthcare information must remain consistent across both channels.

Public discovery data must be available without requiring a patient session.

Protected patient-specific information must require authentication.

Story coverage: Shared Data, Dependencies.

BE-2.11 — Support Authentication Requirement at Booking Entry
Description

Support the authentication requirement when a visitor/patient attempts to enter the protected booking journey.

Requirements:

Discovery itself must remain public.

Booking actions must check authentication status.

An authenticated user must be allowed to proceed into the booking journey.

An unauthenticated user must not enter the protected booking journey without authentication.

The client must receive the information necessary to handle the authentication handoff.

Story coverage: AC-8, AC-9, Business Rules.

BE-2.12 — Support Retention of Discovery Context During Booking Handoff
Description

Support retention of the applicable discovery context when the user moves from discovery toward booking.

The applicable context can include:

Treatment package

Hospital

Department

Doctor

Requirements:

The selected context should be retained where technically supported.

The user should not need to unnecessarily restart the discovery journey.

The context must remain associated with the booking journey after successful authentication where applicable.

Handle the case where the selected discovery record becomes unavailable before booking starts.

Do not invent additional context beyond what is explicitly listed in the story.

Story coverage: AC-10, AC-11, Edge Cases.

BE-2.13 — Protect Patient-Specific and Booking Functionality
Description

Ensure protected functionality is not available to unauthenticated visitors.

Requirements:

Public discovery information can be accessed without authentication.

Patient-specific information requires authentication.

A visitor cannot complete a booking without authentication.

Protected booking functionality requires authentication.

Patient-specific information must not be exposed through public discovery functionality.

Story coverage: Business Rules, Permissions.

BE-2.14 — Support Admin Management of Healthcare Discovery Data
Description

Support the Admin role's ability to manage healthcare discovery data according to the role/permission requirements of the story.

Discovery data includes:

Treatment data

Hospital data

Doctor data

Requirements:

Admin manages healthcare discovery data according to role.

Visitor cannot modify healthcare master data.

Patient cannot modify healthcare master data.

Story coverage: Permissions.

BE-2.15 — Record Administrative Discovery Changes in Audit Trail
Description

Administrative changes to discovery records must capture:

Entity

Action

Administrator

Timestamp

Changed fields

Requirements:

Apply the audit trail to administrative changes to discovery records.

Authentication and booking actions remain under their respective stories.

Story coverage: Audit Trail.
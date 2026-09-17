STORY 2 — HEALTHCARE DISCOVERY


Description

USER STORY
As a visitor or patient, I want to discover treatment packages, hospitals and doctors and view their details so that I can evaluate healthcare options before starting my booking journey.

WEBSITE  &   MOBILE APP (home feed)

BUSINESS VALUE
Enables healthcare discovery without requiring authentication.

Allows visitors to evaluate treatment packages, hospitals and doctors before creating an account.

Provides the entry point to the booking journey.

Provides common discovery across Website and Mobile.

Requires authentication only when the user proceeds into protected booking functionality.

SCOPE / OVERVIEW
This story covers:

Treatment package discovery

Treatment package details

Hospital discovery

Hospital search/listing/profile

Doctor discovery

Doctor search/listing/profile

Navigation into booking

Authentication handoff when booking is initiated by an unauthenticated visitor

REQUIREMENTS
Treatment Packages
Treatment packages shall be publicly discoverable on Website without requiring login.

Visitor/Patient can view available treatment packages.

Visitor/Patient can select a package.

Visitor/Patient can view approved package details.

Visitor/Patient can select Book / Proceed to Booking.

If the user is unauthenticated when attempting to book, the system shall redirect them to Login/Sign Up.

After successful authentication, the user shall be able to continue into the booking journey with the selected treatment/package context retained where technically supported.

Hospitals
Display hospital listings.

Visitor/Patient can search hospitals on Website.

Visitor/Patient can view hospital details/profile.

Visitor/Patient can select a hospital.

Hospital discovery shall not require authentication.

Doctors
Display doctor listings.

Visitor/Patient can search doctors on Website.

Visitor/Patient can view doctor details/profile.

Visitor/Patient can select a doctor.

Doctor discovery shall not require authentication.

Booking Entry
Discovery itself shall remain accessible to unauthenticated visitors.

Selecting Book Appointment or an equivalent booking action shall check authentication status.

If the user is already authenticated, the system shall proceed to the booking journey.

If the user is unauthenticated, the system shall redirect to Login/Sign Up.

After successful authentication, the user shall be able to proceed to booking.

The selected discovery context, such as treatment package, hospital, department or doctor, shall be retained where applicable so that the user does not have to restart the discovery journey.

SHARED DATA
Mobile and Website consume the shared backend.

Approved healthcare information remains consistent across channels.

Public discovery data shall be available without requiring a patient session.

Protected patient-specific information and booking actions shall require authentication.

BUSINESS RULES
Treatment, hospital and doctor discovery does not require authentication.

Website visitors can browse and view approved discovery information without registering or logging in.

Authentication is required when the user attempts to enter the protected booking journey.

Only approved/published records should be shown.

Inactive records follow the approved visibility rule.

Search/filter requirements not confirmed remain TBD.

Real-time availability is not assumed unless explicitly approved.

A visitor shall not be able to access patient-specific information or complete a booking without authentication.

ACCEPTANCE CRITERIA
AC-1 — Public Treatment Discovery
Given the user is unauthenticated, when the user opens treatment discovery on Website, then available treatment packages shall be displayed without requiring login.

AC-2 — Treatment Details
Given a package exists, when the visitor/patient selects it, then its approved details shall be displayed without requiring authentication.

AC-3 — Public Hospital Discovery
Given the user is unauthenticated, when hospital discovery is opened, then available hospitals shall be displayed without requiring login.

AC-4 — Hospital Search
Given the user searches for a hospital, when matching records exist, then matching hospitals shall be displayed.

AC-5 — Public Doctor Discovery
Given the user is unauthenticated, when doctor discovery is opened, then available doctors shall be displayed without requiring login.

AC-6 — Doctor Search
Given the user searches for a doctor, when matching records exist, then matching doctors shall be displayed.

AC-7 — Profile
Given a valid hospital/doctor record exists, when selected, then approved profile information shall be displayed without requiring authentication.

AC-8 — Authenticated Booking Entry
Given the patient is already authenticated, when they select Book Appointment, then the system shall proceed to the booking journey.

AC-9 — Unauthenticated Booking Entry
Given the user is not authenticated, when they select Book Appointment, then the system shall redirect the user to Login/Sign Up.

AC-10 — Continue After Authentication
Given an unauthenticated visitor was redirected to Login/Sign Up from discovery, when authentication is successfully completed, then the system shall allow the user to continue into the booking journey.

AC-11 — Preserve Discovery Context
Given the user selected a treatment package, hospital, department or doctor before authentication, when authentication is successfully completed, then the applicable selected context shall be retained so the booking journey can continue without unnecessary re-selection.

AC-12 — Empty Results
Given no matching records exist, then an appropriate empty state shall be displayed.

NOTIFICATIONS / USER FEEDBACK
No dedicated discovery notification is required.

The system shall provide appropriate:

Loading state

Empty state

Error state

Unavailable state

Login/Sign Up redirect when booking is attempted while unauthenticated

EDGE CASES
No treatment packages

No hospitals

No doctors

No search results

Inactive record

Missing profile information

Backend unavailable

Record becomes unavailable while viewing

Visitor attempts to book without authentication

Login/Sign Up is cancelled

Authentication fails

Selected discovery record becomes unavailable before booking starts

Selected discovery context cannot be retained after authentication

PERMISSIONS
Visitor
View permitted treatment, hospital and doctor discovery information.

Search and view public profiles.

Cannot access patient-specific information.

Cannot complete booking without authentication.

Patient
View permitted discovery information.

Enter the booking journey.

Cannot modify healthcare master data.

Admin
Manages healthcare discovery data according to role.

AUDIT TRAIL
Administrative changes to discovery records should capture:

Entity

Action

Administrator

Timestamp

Changed fields

Authentication and booking actions are audited under their respective stories.

DEPENDENCIES
Treatment data

Hospital data

Doctor data

Search

Shared backend

Patient Authentication

Booking service

Mobile

Website

DEFINITION OF DONE
Treatment discovery is publicly accessible on Website.

Unauthenticated visitors can view treatment details.

Hospital discovery/search works without authentication.

Doctor discovery/search works without authentication.

Profiles work.

Book Appointment checks authentication.

Unauthenticated users are redirected to Login/Sign Up when attempting to book.

Authenticated users proceed directly to booking.

Discovery context is retained across authentication where applicable.

Shared data works across Mobile and Website.

Empty/error/unavailable states work.

QA/UAT passes.
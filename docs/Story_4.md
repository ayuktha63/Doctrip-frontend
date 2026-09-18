STORY 4 — HOSPITAL ADMINISTRATION


Description

User Story
As a Hospital Admin, I want to manage my hospital's departments, doctors and doctor availability so that the hospital can operate its appointment workflow.

WEB PANEL

Business Value
Establishes hospital operational structure.

Maintains departments and doctors.

Maintains doctor availability.

Provides information required for appointment coordination.

Scope / Overview
This story covers:

Hospital operational information

Department management

Doctor management

Treatment management.

Doctor-department assignment

Doctor availability

Hospital operational configuration

Requirements
Hospital
Hospital Admin can access their assigned hospital.

Admin can manage permitted operational information.

Departments
Create department.

Edit department.

Maintain department status.

Assign doctors to departments.

Doctors
Add/manage doctors according to approved model.

Maintain doctor information.

Associate doctor with hospital.

Associate doctor with department.

Availability
Maintain doctor availability.

Availability is used by appointment coordination.

Availability conflicts follow approved rules.

Business Rules
Hospital Admin can operate only within their assigned hospital.

Hospital Admin cannot manage another hospital.

Doctor onboarding/verification rules are TBD where not confirmed.

Exact availability rules are TBD where not confirmed.

Direct Hospital/Doctor access remains dependent on the approved access model.

Acceptance Criteria
AC-1 — Hospital Scope
Given a Hospital Admin is logged in, then only their authorized hospital shall be accessible.

AC-2 — Departments
Given appropriate permission, when a department is created or updated, then the change shall be persisted.

AC-3 — Doctors
Given appropriate permission, when a doctor is added/updated, then the doctor shall be associated with the correct hospital.

AC-4 — Assignment
Given a valid doctor and department exist, when assigned, then the relationship shall be stored.

AC-5 — Availability
Given approved availability rules exist, when availability is updated, then the change shall be stored for appointment coordination.

AC-6 — Unauthorized Hospital
Given the Admin does not belong to a hospital, when access is attempted, then access shall be denied.

Notifications
Event

Recipient

Platform

Notification

Channel

Save success/error

Hospital Admin

Website

Success /error notification

In-Website + Email

Doctor update confirmation

Hospital Admin

Website

Doctor update confirmation

In-Website + Email

Department update confirmation

Hospital Admin

Website

Department update confirmation

In-Website + Email

Availability update confirmation

Hospital Admin

Website

Availability update confirmation

In-Website + Email

Unauthorized access

Hospital Admin

Website

Unauthorized access message

In-Website + Email

Edge Cases
Duplicate doctor

Duplicate department

Wrong hospital assignment

Conflicting availability

Doctor becomes inactive

Availability changes during booking

Concurrent Admin updates

Session expiry

Permissions
Hospital Admin can:

Manage assigned hospital

Manage departments

Manage doctors

Manage availability

Hospital Admin cannot:

Manage another hospital

Perform DocTrip platform administration

Respond as a doctor

Modify unrelated patient accounts

Audit Trail
Record:

Department changes

Doctor changes

Doctor assignments

Availability changes

Admin identity

Timestamp

Previous/new values

Dependencies
Hospital access model

Doctor onboarding

Administrative RBAC

Notification rules

Doctor/department/availability data

Definition of Done
Access model confirmed.

Hospital scope enforced.

Departments work.

Doctors work.

Assignments work.

Availability works.

Audit works.

QA/UAT passes.
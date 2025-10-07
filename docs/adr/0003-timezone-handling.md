# ADR 0003: Normalize schedule times to UTC with localized display

## Status
Accepted

## Context
Conference planners and speakers operate across time zones. Persisting
local times without context leads to ambiguity when generating iCalendar
files or exposing the schedule through APIs. We need a consistent internal
representation while still rendering times in the event's local zone for
attendees.

## Decision
All event timestamps will be stored and processed as UTC instants. The
application will also record the canonical event time zone (e.g.,
`America/Chicago`) and use it to format times for display. When importing
external data, we will normalize to UTC at the boundary of the ingestion
process.

## Consequences
* Calculations such as sorting, duration math, and ICS exports are
  simplified because the application operates on UTC instants.
* The UI layer must format and present times in the event's local zone to
  avoid user confusion.
* Developers need to be vigilant when accepting user input to ensure it is
  captured with an explicit zone before conversion to UTC.

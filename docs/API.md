# Misinformation Examination API

## Overview

This document defines the HTTP API contracts used by the Misinformation Examination browser application.

Misinformation Examination is a single Next.js application. The endpoints in this document are Next.js Route Handlers under `src/app/api/`; they are not a separately deployed backend service.

`Product.md` defines product behavior. `Architecture.md` defines application structure. `Database.md` defines persistent data and transactions. This document defines only the browser-to-server HTTP contracts needed by interactive application operations.

## API Principles

1. Keep the API small and specific to current product operations.
2. Use ordinary JSON requests and responses.
3. Use Route Handlers for all mutations.
4. Keep Route Handlers focused on HTTP validation and response handling. Server-side business functions enforce product rules and coordinate database work.
5. Validate all request data on the server even when it was already validated in the browser.
6. Return small responses containing only the data the browser needs for its next action.
7. Do not expose SQL, database errors, stack traces, or internal implementation details.

## Conventions

### Base Path

All endpoints use paths under:

```text
/api
```

### Content Type

Requests with bodies use:

```http
Content-Type: application/json
```

Successful responses containing bodies return JSON.

### Timestamps

When a timestamp is needed in a response, return it as an ISO 8601 UTC string, for example:

```json
"2026-08-16T14:30:00.000Z"
```

### Success Status Codes

- `200 OK` for a successful update.
- `201 Created` when a Student or Session is created.

### Error Shape

All expected API errors use this minimal shape:

```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Enter a valid email address."
  }
}
```

- `code` is a stable machine-readable value used by application code.
- `message` is a short user-facing message.

Unexpected errors return:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again."
  }
}
```

The server should write the underlying unexpected error to the `logs` table without returning its details to the browser.
All logging is best effort: a database issue must not prevent the endpoint from returning its generic error response.

### Common Error Status Codes

| Status                      | Meaning                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `400 Bad Request`           | Malformed JSON, missing field, wrong type, or invalid value. |
| `401 Unauthorized`          | No valid current-Student cookie is present. This status describes missing application identity even though the initial release does not provide secure authentication. |
| `403 Forbidden`             | The identified resource belongs to another Student.          |
| `404 Not Found`             | The requested resource does not exist.                       |
| `409 Conflict`              | The request is invalid due to a conflict in data/status.     |
| `500 Internal Server Error` | Unexpected server failure.                                   |

Student-owned Sessions should return `403` when accessed by another Student.

## Endpoints

Across all endpoints, derive Student identity from the cookie and check Session ownership on the server.

### Start a Session

```http
POST /api/sessions
```

Start or resume an examination for a Subject. Create the Student and cookie if needed.

Request:

```json
{
  "subjectId": 3
}
```

Server behavior:

1. Identify/validate the Student from the cookie.
2. Return the existing active Session for this Student and Subject, if one exists.
3. Return the latest completed Session if that Subject is already completed.
4. In one transaction, create the Session and all `session_questions` rows in random order.
5. Return only the created Session identifier.

Success response:
- `200 OK` when a Session is resumed.
- `201 Created` when a Session is created.


```json
{
  "sessionId": 45
}
```

Expected errors:

| Status | Code                           | Condition                                               |
| ------ | ------------------------------ | ------------------------------------------------------- |
| `404`  | `SUBJECT_NOT_FOUND`            | The Subject does not exist.                             |

### Save a Guess

```http
PUT /api/sessions/{sessionId}/questions/{questionId}/guess
```

Save or update the selected Choice. The Question must belong to the active Session. The Choice must be valid.

Request:

```json
{
  "choice": 3
}
```

Server behavior:

1. Using PUT makes retrying the same selection safe.
2. The browser should auto-advance only after saving succeeds.

Success response — `200 OK`:

Expected errors:

| Status | Code                        | Condition                               |
| ------ | --------------------------- | ----------------------------------------|
| `400`  | `INVALID_SESSION_ID`        | `sessionId` is not a valid integer.     |
| `400`  | `INVALID_QUESTION_ID`       | `questionId` is not a valid integer.    |
| `400`  | `INVALID_CHOICE`            | `choice` is not a valid integer.        |
| `403`  | `SESSION_FORBIDDEN`         | The Session belongs to another Student. |
| `404`  | `SESSION_NOT_FOUND`         | The Session does not exist.             |
| `404`  | `QUESTION_NOT_FOUND`        | The Question does not exist.            |
| `404`  | `CHOICE_OUT_OF_BOUNDS`      | Choice is not valid for this Question.  |
| `409`  | `SESSION_ALREADY_COMPLETED` | The Session is no longer active.        |

### Complete an examination

```http
POST /api/sessions/{sessionId}/complete
```

Finish the examination after verifying every Question has a recorded Guess.

Success response — `200 OK` (no response body):

Server behavior:

1. Verify that every Question has a Guess.
2. Set `completed_at`.
3. Log the completion event.

Expected errors:

| Status | Code | Condition |
| --- | --- | --- |
| `400`  | `INVALID_SESSION_ID` | `sessionId` is not a valid integer.     |
| `403`  | `SESSION_FORBIDDEN`  | The Session belongs to another Student. |
| `404`  | `SESSION_NOT_FOUND`  | The Session does not exist.             |
| `409`  | `SESSION_INCOMPLETE` | Guess are missing.                      |

### Save an email

```http
PUT /api/student/email
```

Save or update the Student’s email address. Create the Student and cookie if needed.

Request:

```json
{ "email": "student@example.com" }
```

Server behavior:

- Validate the email on the server.
- Save the email against the cookie’s Student.
- Log the event.

Success response — `200 OK` (no response body):

Expected errors:

| Status | Code | Condition |
| --- | --- | --- |
| `400` | `INVALID_EMAIL` | Email is malformed, is not a string, or exceeds the character limit. |

### Submit general feedback

```http
POST /api/feedback
```

Submit general feedback.

Request body:

```json
{ "message": "My feedback..." }
```

Server behavior:

- Validate that feedback >= 5 characters.
- Save the feedback in the database.
- Log the event.

Success response — `200 OK` (no response body):

### Submit question feedback

```http
POST /api/questions/{questionId}/feedback
```

Submit feedback about a particular Question.

Request body:

```json
{ "message": "Please review this source..." }
```

Server behavior:

- Validate the feedback on the server, e.g. the 'message' must be >= 5 characters.
- Save the feedback in the database.
- Log the event.

Success response — `200 OK` (no response body):

Expected errors:

| Status | Code                        | Condition                               |
| ------ | --------------------------- | ----------------------------------------|
| `400`  | `INVALID_QUESTION_ID`       | `questionId` is not a valid integer.    |
| `404`  | `QUESTION_NOT_FOUND`        | The Question does not exist.            |

## Server-Rendered Page Data

The following data is expected to be loaded by Server Components through server-side functions rather than by calling the application's own API:

- The Landing page.
- The Session Examination page.
- The Session Complete page.
- The Question page.

These server-side data shapes should be kept close to the pages that use them. They do not need public HTTP contracts in this document unless browser-side requirements later make an endpoint useful.

## Route Handler Placement

Route Handlers should be placed in src/app/api/

Every Route Handler that uses PostgreSQL must use the Node.js runtime rather than the Edge runtime.

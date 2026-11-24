# Misinformation Examination Architecture

## Overview

Misinformation Examination is a small, cloud-hosted web application.
The architecture should be as simple as practical for development, deployment, hosting, and maintenance.
The initial release will use a **single full-stack Next.js application** connected directly to a managed PostgreSQL database.
This document defines the technical architecture and should not duplicate product requirements (Product.md), Database requirements (Database.md), or API requirements (API.md).

## Architecture Principles

1. Prefer the simplest solution that satisfies the current requirements.
2. Do not introduce infrastructure, services, libraries, or abstractions without a demonstrated need.
3. Keep the application as a single deployable application.
4. Use direct SQL rather than an ORM.
5. Use managed cloud services where they eliminate meaningful setup or maintenance.
6. Optimize for features as currently defined rather than hypothetical future requirements.

## Technology Stack

- **Language:** TypeScript
- **Web framework:** Next.js with App Router
- **UI:** React
- **Database:** PostgreSQL
- **Database access:** Direct parameterized SQL
- **PostgreSQL client:** `pg`
- **Application hosting:** Vercel
- **Database hosting:** Neon
- **Package manager:** npm
- **Source control:** Git and GitHub

No ORM will be used.
No PostgreSQL installation is required on the development computer.

## High-Level Architecture

```text
Browser
   | page requests and mutation API requests
   v
Next.js Application
   |-- Server Components
   |-- Client Components
   |-- Route Handlers
   |
   | direct SQL
   v
Neon PostgreSQL
```

The development and production environments each consist of one Next.js application connected to one PostgreSQL database. They use separate databases. Preview deployment behavior is described under Secrets and Configuration.
The browser never connects directly to PostgreSQL.
Route Handlers provide HTTP API endpoints within the Next.js application. There is no separately deployed backend or API service.

## Environments

Use separate Neon databases for development and production.

```text
Development: Browser -> Next.js running locally -> Neon Development Database
Production: Browser -> Next.js on Vercel -> Neon Production Database
```

Local development therefore requires only: Git, Node.js, npm, Internet access. A local PostgreSQL installation is not required.

## Application Structure

Keep the source structure small.
A reasonable initial structure is:

```text
src/
  app/
    api/
    ...
  server/
    db.ts
    ...

database/
  001_migration_initial.sql

docs/
  AIInstructions.md
  API.md
  Architecture.md
  CodingStandards.md
  Database.md
  Product.md
```

Additional directories should be created only when the amount of code makes them useful.
Do not create architectural layers merely to follow a pattern.

## Next.js

Use Next.js for both the UI and server-side application code.

Prefer:

- Server Components for retrieving and rendering server data.
- Route Handlers with explicit HTTP API endpoints for application mutations.
- Client Components only where browser-side interactivity requires them.

Misinformation Examination mutations must use Route Handlers under `src/app/api/` rather than Server Actions.
Client Components should call endpoints using ordinary HTTP requests. Prefer POST for application actions; use other HTTP methods when they make the endpoint clearer.

Each Route Handler should:

1. Validate the request on the server.
2. Call a server-side business function, which coordinates product rules and calls database functions as needed.
3. Return an explicit HTTP status and, when the browser needs data, a small JSON response.

The architecture should have a lightweight separation: Route Handler → business function → database function → PostgreSQL.
The endpoint contracts belong in `API.md`.
Use a consistent minimal JSON error shape across endpoints.

Do not use Server Actions for mutations unless this architecture decision is deliberately revisited.
Server Components may retrieve data directly through server-side database modules. They do not need to call the application's own HTTP endpoints for reads.

For public pages, the server passes data to the interactive Client Component using small application data shapes containing only the fields needed by the browser.

Do not create a separate REST, GraphQL, or other backend service. The Route Handlers are part of the same Next.js application and deployment.

Server Components and Route Handlers that access PostgreSQL must use the Next.js Node.js runtime rather than the Edge runtime.

## Database Access

Use the `pg` PostgreSQL client and direct SQL.
Create one small server-only database module that initializes and exports a shared `pg` connection pool. Use Neon’s pooled application connection string. Do not add a separate database framework around it.

SQL must:

- Execute only on the server.
- Use parameters for values supplied by users.
- Be kept out of React UI components.

Keep SQL in server-only files rather than React components. Group related queries together when that improves readability; a separate module for every table or query is not required.

Avoid adding:

- An ORM.
- A repository framework.
- A database abstraction framework.
- Generated database models.
- A query builder.

These can be introduced later if direct SQL becomes difficult to maintain.

## Database Schema

PostgreSQL is the authoritative persistent data store.
The detailed schema belongs in `Database.md`.
Use PostgreSQL primary keys, foreign keys, unique constraints, and check constraints to enforce database invariants where practical.

## Database Changes

Database changes should be written as ordinary SQL and stored in source control.

Example:

```text
database/
  001_migration_initial.sql
  002_seed_people.sql
  003_migration_example_change.sql
```

Every `.sql` filename must begin with its numeric sequence followed by either `migration` or `seed`, using the format `<number>_migration_<description>.sql` or `<number>_seed_<description>.sql`.
A dedicated migration framework is not required.
Introduce migration tooling only if manually applying versioned SQL becomes burdensome or error-prone.
Migration files must be applied in numeric order. Once a migration has been applied to production, it must not be edited; corrections require a new migration file.

## Application State

PostgreSQL should contain durable state needed to resume a Session.
Temporary UI state should remain in the browser or React component state when it does not need to survive navigation or refresh.
Do not add:
- Redis.
- A distributed cache.
- A server-side session store.
- A separate state-management system such as Redux.

Use ordinary React state when local browser state is sufficient.

## Business Logic

Product rules that affect trusted or persistent behavior must be enforced on the server, using straightforward TypeScript, SQL, or PostgreSQL constraints as appropriate. Keep related code together and extract reusable functions only when useful.
Keep Route Handlers focused on HTTP concerns. Put product rules and operation coordination in small server-side business functions. Business functions may call small database functions containing direct parameterized SQL. Do not introduce additional service, repository, use-case, or dependency-injection layers.
Keep rules that do not require database access as ordinary TypeScript functions when practical.

### Student Identity and Access

The application stores the Key in a browser cookie so the user can revisit Sessions that they have started or completed.
The current-Student cookie should be set by the server and use `HttpOnly` (Client-side JavaScript cannot delete the cookie), `SameSite=Lax`, and `Secure` in production. It must not be treated as proof of authenticated identity.
Do not introduce an authentication framework. Authentication can be redesigned if login, passwords or stronger identity verification are added in a future release.
This Student cookie is unrelated to Administration access and must never authorize Administration requests.
- Resolve the current Student using the browser cookie.
- Loading a page does not create a Student, set a cookie, or create a Session. Those operations occur through the mutation endpoints.
- Before returning Student-owned data, verify that the Session belongs to the current Student.
- If no valid Student cookie exists, redirect Session pages to the Landing page.
- If a Session does not exist or belongs to another Student, display a not-found page.

### Landing Page

- Load the available Subjects and the current Student's Session status for each Subject.
- Without a valid Student cookie, show all Subjects as not started.

### Administration Access

- Open the Administration page at `/admin`. It renders the sign-in form until a valid Administration cookie is present.
- Keep the Administration UI and its Route Handlers in the existing Next.js application. Require the Administration password before returning Administration data or accepting Question mutations; protect each server request, not only the browser page.
- Read the password from a server-only `ADMIN_PASSWORD` environment variable. Store it in `.env.development.local` for development and in Vercel environment variables for production, following the database credential pattern below. Never commit it, send it to the browser, or write it to logs.
- Verify submitted passwords on the server. After successful verification, issue a separate, signed, `HttpOnly`, `SameSite=Lax` Administration cookie with `Secure` in production and a bounded expiration. Keep the signing secret in a separate server-only `ADMIN_SESSION_SECRET` environment variable stored the same way. Reject invalid or expired cookies. Logging out clears the cookie.
- An Administration cookie must not grant access to Student-owned Sessions. Protect Administration read paths and mutation endpoints independently of the Student cookie.
- Initially leave the Subject unselected; load its Question form only after the Administrator chooses a Subject. Retrieve all Questions for the selected Subject in ascending `questions.id`, including inactive Questions, and initially display the last saved Question. Show a blank new-Question form if none exist. The Subject selection and current draft are temporary browser state. Initialize a new Question's `is_active` value to `true`. Disable Question navigation and Subject switching while the draft has unsaved edits. Save explicitly through a Route Handler before allowing navigation again; Next and Previous perform no mutation. Use Route Handlers for password verification, logout, and Question creation or updates.

### Session Page

- Use the same URL, /sessions/{sessionId}, for an active examination and its completed results.
- Read completed_at to determine which content to render.
- For an active Session, load the assigned Questions in their stored order, Choices, saved Guesses, and progress.
- Initially display the first Question without a Guess, or the last Question if all Questions have Guesses.
- Do not send correct Answers, correctness indicators, explanations, or sources to the browser before completion, including in Client Component props.
- For a completed Session, load the results and Answers in the stored Question order.

### Question Page

- Load the Question, Answer, explanation, sources, and the Student's Guess from the relevant completed Session.
- Verify ownership and Session completion before returning these data.
- The page URL must identify the Session and Question so that the correct Guess can be retrieved.

### Client Behavior After Mutations

- After starting or resuming a Session, navigate to /sessions/{sessionId}.
- After saving a first Guess, update local state and auto-advance only after the server confirms success. After updating a saved Guess, stay on the current Question. Previous and Next operate locally.
- If saving fails, preserve the selection, show an error, and do not auto-advance.
- After completing a Session, call router.refresh() so the same URL displays completed results.
- After saving an email, refresh server-rendered Student information so the email-entry sections disappear.
- Feedback submissions show confirmation locally without requiring a page refresh.

### Freshness

- Read Student-specific identity, Guesses, and Session completion state at request time without persistent server-side caching.
- Do not share Student-specific rendered output between Students.

## Transactions

Use PostgreSQL transactions only where multiple database changes must succeed or fail together to preserve valid data.
Do not wrap ordinary single-statement operations in unnecessary transactions.

## Concurrency

The expected initial audience is small.
Do not introduce distributed locking or other specialized concurrency infrastructure.
Use normal PostgreSQL constraints and transactions where correctness requires them.
More sophisticated concurrency controls should be added only if actual usage demonstrates a problem.
- The browser should disable an action button while its request is pending to reduce accidental duplicate requests.
- No idempotency-key framework is required initially.

## Validation

Validate all untrusted request data on the server. Validation is required before using input in database operations or business logic.
Client-side validation may also be used when it improves the user experience, but it should remain simple.
Do not introduce a separate validation framework unless native TypeScript/application validation becomes cumbersome.

## Secrets and Configuration

The application requires at least a PostgreSQL connection string. Administration also requires `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
Database credentials and Administration secrets must not be committed to Git.

Use:
- `.env.development.local` for the development database connection.
- Vercel environment variables for the production database connection.

Store the Administration secrets in those same environment-specific locations. Use different values for development and production. Vercel preview deployments must not receive production Administration secrets.

The Resend log-email integration uses `RESEND_API_KEY` and `LOG_EMAIL_TO` as server-only Vercel environment variables.
Vercel preview deployments must not receive the production database connection string. Initially, previews may use the development database or have no database configured.

## Error Handling

Handle expected errors with simple user-facing messages.
Do not create a custom error-handling framework.

## Logging and Monitoring

Write server-side errors and operational warnings to the PostgreSQL `logs` table when the database is available. Errors use the default `error` severity; warnings use severity `warning`. If database logging fails, write the error to the server console without retrying the database write.
After each application-created log row commits, make a best-effort attempt to email its exact message through Resend to `LOG_EMAIL_TO`, from `Cherry Tree <logs@misinformation.wadecherry.us>`, with the subject `New log added to Misinformation`. Email failures are written to the server console and must not fail or roll back the operation that created the log. Do not introduce another logging, monitoring, tracing, or observability service.

## Testing

Testing should concentrate on logic where mistakes would affect product behavior.

### Unit Tests

Add focused unit tests for pure product logic where edge cases could affect visible behavior. Broad coverage targets are not required.

## Deployment

Production deployment is:

```text
GitHub
   |
   v
Vercel
   |
   v
Next.js
   |
   v
Neon PostgreSQL
```

Vercel deploys the Next.js application from GitHub.
Neon hosts PostgreSQL separately.
No production server needs to be manually maintained.

## Initial Release Non-Goals

Do not introduce any of the following:

- Separate frontend and backend applications.
- Separate API service.
- Microservices.
- ORM.
- Query builder.
- Local PostgreSQL.
- Docker.
- Kubernetes.
- Redis.
- Message queues.
- GraphQL.
- WebSockets.
- Serverless infrastructure beyond what the hosting platform provides automatically.
- Dedicated authentication framework.
- Separate administrative application or deployment.
- Dedicated migration framework.
- Repository pattern.
- Dependency injection framework.
- Distributed caching.
- Dedicated logging platform.
- Dedicated monitoring platform.
- Dedicated analytics infrastructure.
- Search engine.
- CDN configuration beyond hosting defaults.

## When to Add Complexity

A technology or architectural layer should be added only when:

1. An existing Product.md requirement cannot reasonably be implemented without it; or
2. The current implementation has demonstrated a concrete maintainability, reliability, security, performance, or operational problem.

Do not add infrastructure merely because it may become useful someday.

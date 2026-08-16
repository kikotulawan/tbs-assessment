# Meridian Staffing Assistant

Assessment application built with Next.js, TypeScript, Tailwind CSS, and the Vercel AI SDK.

## Architecture

```text
Browser
  │
  │ HTTPS
  ▼
Next.js
  ├── React UI
  └── /api/assistant
        │
        ├── Meridian Staffing API
        │     ├── HR
        │     ├── Scheduling
        │     └── Credentialing
        │
        └── OpenRouter / LLM
```

The Meridian and OpenRouter credentials are server-only environment variables. They are never exposed through `NEXT_PUBLIC_*` variables and must never be committed.

## Meridian data model

Meridian exposes three systems of record:

- HR: employees keyed by `employeeId` (`E-*`)
- Scheduling: workers keyed by `workerId` (`W-*`)
- Credentialing: credential records keyed by `recordId` and linked to HR `employeeId`

Scheduling workers and HR employees use different identifier spaces. The documented join is normally `workEmail` ↔ `email`.

List endpoints are paginated at a maximum of 20 records per page, so the application checks `pagination.totalPages`.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the assessment credentials. Never commit it.

## Security decisions

- Meridian API key remains on the Next.js server.
- OpenRouter API key remains on the Next.js server.
- No assessment credential is prefixed with `NEXT_PUBLIC_`.
- Meridian record text is treated as untrusted data by the assistant prompt.
- The server performs cross-system joins; the browser only talks to `/api/assistant`.

## AI tool/model

The assessment-preferred stack is Next.js + TypeScript + Vercel AI SDK. The assistant uses the Vercel AI SDK with an OpenRouter OpenAI-compatible endpoint.

Record the exact model used during the assessment here:

- Model: `OPENROUTER_MODEL`
- SDK: Vercel AI SDK
- Provider: OpenRouter

## Known implementation notes

The first implementation deliberately keeps retrieval server-side and bounded by the user's question. For the final assessment pass, improve query planning so each question retrieves only the necessary Meridian records and avoids unnecessary API calls.

## Deployment

Recommended production layout:

```text
Internet
  │
  ▼
Nginx / HTTPS / Basic Auth
  │
  ▼
Next.js application
  ├── static/React UI
  └── server route
        ├── Meridian
        └── OpenRouter
```

Keep the Next.js process alive with the process manager selected during the assessment and document the command used.

## QA

See `ANSWERS.md` for the six required assessment questions and the recorded production answers.

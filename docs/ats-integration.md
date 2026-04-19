# ATS Integration - arbeidmatch.no ↔ ats.arbeidmatch.no

## Status: READY FOR INTEGRATION

Website-side scaffolding is in place. Implement ATS endpoints and set environment variables to activate outbound calls.

## Architecture

- **Website (Next.js)** → REST (server-side only) → **ATS** (`ats.arbeidmatch.no`)
- **ATS** → **Webhooks** → **Website** (`POST /api/ats/webhook`)

## Environment variables

| Variable            | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `ATS_BASE_URL`      | Base URL of the ATS app (default in code)    |
| `ATS_API_KEY`       | Server-to-server API key (ATS admin)         |
| `ATS_API_SECRET`    | Optional - reserved for future signing       |
| `ATS_WEBHOOK_SECRET`| Shared secret for verifying inbound webhooks |

Copy from `.env.example` into `.env.local` / Vercel - never commit secrets.

## ATS endpoints to build (on ats.arbeidmatch.no)

| Method | Path                    | Purpose                    |
| ------ | ----------------------- | -------------------------- |
| POST   | `/api/candidates`       | Register candidate         |
| POST   | `/api/partners/check`   | Verify partner by email    |
| POST   | `/api/jobs`             | Create job post            |
| POST   | `/api/employers/register` | Register employer for approval |

Optional: `GET /api/jobs/public` - public job listings.

## Website endpoints (ready)

| Method | Path                 | Purpose                          |
| ------ | -------------------- | -------------------------------- |
| POST   | `/api/ats/webhook`   | Receive events from ATS          |

## Client module

- **`src/lib/atsClient.ts`** - `registerCandidateInATS`, `checkPartnerStatus`, `createJobPostInATS`, `registerEmployerInATS`
- All calls are **no-op** until real `fetch` is uncommented and `ATS_API_KEY` is set.
- Errors are **never thrown** to callers; failures are swallowed so the site keeps working.

## How to activate

1. Deploy ATS with the endpoints above.
2. Set `ATS_API_KEY` (and optionally `ATS_WEBHOOK_SECRET`) in Vercel / `.env.local`.
3. Uncomment the `fetch` blocks in `src/lib/atsClient.ts` and map response shapes.
4. Wire calls from your API routes / server actions where business logic requires (optional, non-breaking).

## Security notes

- Use **API key** in `Authorization` or `X-API-Key` (align with ATS when implemented).
- **Webhook**: verify signature with `ATS_WEBHOOK_SECRET` when ATS defines the signing scheme.
- **Never** call ATS from the browser - only from server code.

## Graceful degradation

If ATS is down or keys are missing, the website must continue to work. The client is designed for silent failure and safe defaults (`isPartner: false`, etc.).

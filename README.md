This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Weekly Reports (Monday 07:00)

This project sends two weekly report emails every Monday at 07:00 via Vercel Cron:

- `/api/weekly-guide-interest-report`
- `/api/weekly-candidate-feedback-report`

Both schedules are configured in `vercel.json`.

Required environment variables:

- `CRON_SECRET` (protects cron endpoints)
- `SMTP_PASS`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Required Supabase tables

`guide_interest_signups`:

```sql
create table if not exists public.guide_interest_signups (
  id bigint generated always as identity primary key,
  notify_email text not null,
  wants_assistance text,
  target_region text,
  target_country text,
  created_at timestamptz not null default now()
);
```

`candidate_feedback_submissions`:

```sql
create table if not exists public.candidate_feedback_submissions (
  id bigint generated always as identity primary key,
  source text not null,
  purpose text not null,
  page_url text not null,
  score integer not null check (score between 1 and 10),
  note text,
  email text,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists candidate_feedback_submissions_created_at_idx
  on public.candidate_feedback_submissions (created_at desc);

create index if not exists candidate_feedback_submissions_anonymous_created_at_idx
  on public.candidate_feedback_submissions (is_anonymous, created_at desc);

create index if not exists candidate_feedback_submissions_page_url_idx
  on public.candidate_feedback_submissions (page_url);
```

You can also run the same SQL from `supabase/candidate_feedback_submissions.sql`.

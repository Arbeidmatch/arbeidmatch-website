create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  invoice_number text not null unique,
  employer_email text not null,
  company_name text,
  org_number text,
  address text,
  amount_ex_vat integer not null,
  vat_amount integer not null,
  amount_inc_vat integer not null,
  vat_rate numeric default 0.25,
  currency text default 'NOK',
  status text check (status in ('draft', 'pending', 'paid', 'overdue', 'cancelled')) default 'pending',
  due_date date not null,
  paid_at timestamptz,
  items jsonb not null default '[]'::jsonb,
  stripe_payment_intent_id text,
  pdf_path text,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create sequence if not exists public.invoice_sequence start 1;

create table if not exists public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer default 1,
  unit_price integer not null,
  total integer not null,
  created_at timestamptz default now()
);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
as $$
declare
  seq_value bigint;
  current_year text;
begin
  current_year := to_char(now(), 'YYYY');
  seq_value := nextval('public.invoice_sequence');
  return 'ARB-' || current_year || '-' || lpad(seq_value::text, 4, '0');
end;
$$;

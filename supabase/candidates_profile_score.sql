-- Candidate profile scoring system (0-100)
-- Run after supabase/candidates.sql

alter table public.candidates
  add column if not exists profile_score integer not null default 0;

alter table public.candidates
  add column if not exists cv_uploaded boolean not null default false;

alter table public.candidates
  add column if not exists profile_photo_url text;

alter table public.candidates
  add column if not exists certifications jsonb not null default '[]'::jsonb;

alter table public.candidates
  add column if not exists english_level text;

create or replace function public.recalculate_candidate_profile_score(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.candidates%rowtype;
  cv_points integer := 0;
  photo_points integer := 0;
  experience_points integer := 0;
  cert_points integer := 0;
  permit_points integer := 0;
  english_points integer := 0;
  complete_points integer := 0;
  cert_count integer := 0;
  score integer := 0;
  complete_ok boolean := false;
  english_norm text := '';
begin
  select *
  into c
  from public.candidates
  where id = p_candidate_id;

  if not found then
    raise exception 'Candidate not found: %', p_candidate_id;
  end if;

  if coalesce(c.cv_uploaded, false) then
    cv_points := 20;
  end if;

  if coalesce(nullif(c.profile_photo_url, ''), '') <> '' then
    photo_points := 10;
  end if;

  if c.experience_years is not null then
    if c.experience_years > 5 then
      experience_points := 25;
    elsif c.experience_years > 3 then
      experience_points := 15;
    end if;
  end if;

  cert_count := coalesce(jsonb_array_length(c.certifications), 0);
  cert_points := least(20, greatest(0, cert_count) * 5);

  if coalesce(c.has_permit, false) then
    permit_points := 10;
  end if;

  english_norm := upper(coalesce(trim(c.english_level), ''));
  if english_norm in ('B2', 'C1', 'C2')
    or english_norm like '%B2%'
    or english_norm like '%C1%'
    or english_norm like '%C2%' then
    english_points := 15;
  end if;

  complete_ok := (
    coalesce(c.email, '') <> '' and
    coalesce(c.first_name, '') <> '' and
    coalesce(c.last_name, '') <> '' and
    coalesce(c.phone, '') <> '' and
    coalesce(c.current_country, '') <> '' and
    coalesce(c.city, '') <> '' and
    coalesce(c.video_link, '') <> '' and
    c.job_preferences is not null and
    coalesce(c.profile_completion_step, 0) >= 9
  );
  if complete_ok then
    complete_points := 10;
  end if;

  score := least(100, cv_points + photo_points + experience_points + cert_points + permit_points + english_points + complete_points);

  update public.candidates
  set profile_score = score,
      updated_at = now()
  where id = p_candidate_id;

  return jsonb_build_object(
    'candidate_id', p_candidate_id,
    'profile_score', score,
    'breakdown', jsonb_build_object(
      'cv_uploaded', cv_points,
      'profile_photo', photo_points,
      'experience', experience_points,
      'certifications', cert_points,
      'driving_license', permit_points,
      'english_b2_plus', english_points,
      'profile_complete', complete_points
    ),
    'source', 'sql_function'
  );
end;
$$;

-- AM-WEB-URGENT: manual legal_documents audit (Supabase SQL editor).
-- 1) In your SQL client, replace SEARCH_TOKEN_1 and SEARCH_TOKEN_2 with the tokens you need to find
--    (founder full name split or other identifiers you already know appear in DB).
-- 2) Review results, then edit rows in the Supabase UI or apply a one-off UPDATE you write locally.
-- 3) Do not commit personal identifiers into this repository.

SELECT id, title, left(content_md, 120) AS preview
FROM legal_documents
WHERE content_md ILIKE '%' || 'SEARCH_TOKEN_1' || '%'
   OR content_md ILIKE '%' || 'SEARCH_TOKEN_2' || '%';

DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.card_designs'::regclass
    AND contype = 'u'
    AND (
      SELECT array_agg(attname::text ORDER BY attname::text)
      FROM unnest(conkey) k
      JOIN pg_attribute a ON a.attrelid = 'public.card_designs'::regclass AND a.attnum = k
    ) = ARRAY['country_id','view_no']
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.card_designs DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.card_designs
  ADD CONSTRAINT card_designs_country_category_view_uniq
  UNIQUE (country_id, category_id, view_no);
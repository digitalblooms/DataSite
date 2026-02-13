-- DIAGNOSTIC QUERIES FOR GRANTS JOIN ISSUE

-- ============================================================================
-- 1. CHECK GRANT DATA EXISTS
-- ============================================================================
-- Do you have grants with non-null values?
SELECT
  funder_charity_id,
  recipient_name,
  amount,
  grant_year,
  COUNT(*) as grant_count
FROM charity_grants
WHERE amount IS NOT NULL
  AND recipient_name IS NOT NULL
GROUP BY funder_charity_id, recipient_name, amount, grant_year
LIMIT 10;

-- ============================================================================
-- 2. CHECK DATA TYPES
-- ============================================================================
-- What are the actual data types?
SELECT
  typeof(funder_charity_id) as funder_id_type,
  funder_charity_id,
  typeof(amount) as amount_type,
  amount,
  typeof(grant_year) as year_type,
  grant_year
FROM charity_grants
LIMIT 5;

-- ============================================================================
-- 3. CHECK organisation_number FORMAT
-- ============================================================================
-- What does organisation_number look like?
SELECT
  typeof(organisation_number) as org_num_type,
  organisation_number,
  CAST(organisation_number AS STRING) as org_num_as_string,
  LENGTH(CAST(organisation_number AS STRING)) as org_num_length
FROM publicextract_charity
LIMIT 5;

-- ============================================================================
-- 4. CHECK funder_charity_id FORMAT
-- ============================================================================
-- What does funder_charity_id look like?
SELECT
  typeof(funder_charity_id) as funder_id_type,
  funder_charity_id,
  LENGTH(funder_charity_id) as funder_id_length,
  -- Check for leading zeros or spaces
  TRIM(funder_charity_id) as trimmed_id
FROM charity_grants
WHERE funder_charity_id IS NOT NULL
LIMIT 5;

-- ============================================================================
-- 5. TEST THE JOIN DIRECTLY
-- ============================================================================
-- Does the join actually match anything?
SELECT
  pc.organisation_number,
  pc.charity_name,
  cg.funder_charity_id,
  cg.recipient_name,
  cg.amount,
  cg.grant_year
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = cg.funder_charity_id
WHERE pc.charity_registration_status = 'Registered'
LIMIT 10;

-- If above returns 0 rows, try these variations:

-- ============================================================================
-- 6. TRY DIFFERENT JOIN CONDITIONS
-- ============================================================================

-- Version A: No casting
SELECT COUNT(*) as match_count
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON pc.organisation_number = cg.funder_charity_id;

-- Version B: Cast both sides
SELECT COUNT(*) as match_count
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = CAST(cg.funder_charity_id AS STRING);

-- Version C: Trim and cast
SELECT COUNT(*) as match_count
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = TRIM(cg.funder_charity_id);

-- Version D: Try registered_charity_number instead
SELECT COUNT(*) as match_count
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON CAST(pc.registered_charity_number AS STRING) = cg.funder_charity_id;

-- ============================================================================
-- 7. CHECK GRANT YEARS
-- ============================================================================
-- What years are in your grants?
SELECT
  grant_year,
  COUNT(*) as grant_count
FROM charity_grants
GROUP BY grant_year
ORDER BY grant_year DESC;

-- Are they within last 3 years?
SELECT
  YEAR(CURRENT_DATE()) as current_year,
  YEAR(CURRENT_DATE()) - 3 as three_years_ago,
  MIN(grant_year) as min_year_in_data,
  MAX(grant_year) as max_year_in_data
FROM charity_grants;

-- ============================================================================
-- INSTRUCTIONS:
-- Run queries 1-7 and share the results. This will tell us exactly what's wrong!
-- ============================================================================

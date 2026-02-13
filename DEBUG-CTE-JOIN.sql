-- DEBUG: Why is the CTE JOIN not matching?

-- ============================================================================
-- TEST 1: Does the CTE return any data?
-- ============================================================================
WITH grants_data AS (
  SELECT
    funder_charity_id,
    COUNT(DISTINCT grant_index) as grants_given_count,
    SUM(amount) as total_grants_given,
    MAX(grant_year) as latest_grant_year
  FROM charity_grants
  WHERE grant_year >= YEAR(CURRENT_DATE()) - 3
    AND amount IS NOT NULL
  GROUP BY funder_charity_id
)
SELECT * FROM grants_data LIMIT 10;

-- If this returns 0 rows, the problem is the CTE WHERE clause
-- If it returns rows, the problem is the JOIN condition

-- ============================================================================
-- TEST 2: What do the IDs look like?
-- ============================================================================
-- Check funder_charity_id format
SELECT DISTINCT
  funder_charity_id,
  typeof(funder_charity_id) as id_type,
  LENGTH(funder_charity_id) as id_length
FROM charity_grants
LIMIT 5;

-- Check organisation_number format
SELECT
  organisation_number,
  typeof(organisation_number) as num_type,
  CAST(organisation_number AS STRING) as num_as_string,
  LENGTH(CAST(organisation_number AS STRING)) as num_length
FROM publicextract_charity
WHERE charity_name LIKE '%Woodland Trust%'
LIMIT 5;

-- ============================================================================
-- TEST 3: Try the JOIN directly (without CTE)
-- ============================================================================
SELECT
  pc.organisation_number,
  pc.charity_name,
  CAST(pc.organisation_number AS STRING) as org_as_string,
  cg.funder_charity_id,
  CAST(cg.funder_charity_id AS STRING) as funder_as_string,
  COUNT(*) as match_count
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = CAST(cg.funder_charity_id AS STRING)
WHERE pc.charity_name LIKE '%Woodland Trust%'
GROUP BY
  pc.organisation_number,
  pc.charity_name,
  cg.funder_charity_id;

-- If this returns 0 rows, the JOIN condition is wrong

-- ============================================================================
-- TEST 4: Check if Woodland Trust has grants at all
-- ============================================================================
-- First get their organisation_number
SELECT
  organisation_number,
  registered_charity_number,
  charity_name
FROM publicextract_charity
WHERE charity_name LIKE '%Woodland Trust%';

-- Then check if that number appears in grants (replace 294344 with actual number)
SELECT
  funder_charity_id,
  COUNT(*) as grants_count
FROM charity_grants
WHERE funder_charity_id = '294344'  -- Replace with actual org number
GROUP BY funder_charity_id;

-- Try variations
SELECT COUNT(*) FROM charity_grants WHERE funder_charity_id LIKE '%294344%';

-- ============================================================================
-- TEST 5: What years are in your grants?
-- ============================================================================
SELECT
  YEAR(CURRENT_DATE()) as current_year,
  YEAR(CURRENT_DATE()) - 3 as three_years_ago,
  MIN(grant_year) as min_grant_year,
  MAX(grant_year) as max_grant_year,
  COUNT(*) as total_grants
FROM charity_grants
WHERE amount IS NOT NULL;

-- Are your grants older than 3 years?

-- ============================================================================
-- TEST 6: Try without year filter
-- ============================================================================
WITH grants_data AS (
  SELECT
    funder_charity_id,
    COUNT(DISTINCT grant_index) as grants_given_count
  FROM charity_grants
  WHERE amount IS NOT NULL  -- No year filter!
  GROUP BY funder_charity_id
)
SELECT
  pc.charity_name,
  grants_data.grants_given_count
FROM publicextract_charity pc
LEFT JOIN grants_data
  ON CAST(pc.organisation_number AS STRING) = CAST(grants_data.funder_charity_id AS STRING)
WHERE pc.charity_name LIKE '%Woodland Trust%';

-- If this works, the year filter is the problem

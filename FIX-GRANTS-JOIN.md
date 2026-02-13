# Fix Grants JOIN Issue

Your grants have data in Databricks but return as null - this is almost always a JOIN mismatch problem.

## 🎯 Quick Fixes to Try

### Fix #1: Cast Both Sides (Most Common)

In your **WITH-GRANTS-build-sql.js**, find this line:
```javascript
ON CAST(pc.organisation_number AS STRING) = cg.funder_charity_id
```

**Replace with:**
```javascript
ON CAST(pc.organisation_number AS STRING) = CAST(cg.funder_charity_id AS STRING)
```

### Fix #2: Try TRIM (Spaces Issue)

**Replace with:**
```javascript
ON CAST(pc.organisation_number AS STRING) = TRIM(cg.funder_charity_id)
```

### Fix #3: Use registered_charity_number Instead

**Replace with:**
```javascript
ON CAST(pc.registered_charity_number AS STRING) = cg.funder_charity_id
```

### Fix #4: Remove Year Filter (Testing)

Find this line:
```javascript
AND cg.grant_year >= YEAR(CURRENT_DATE()) - 3
```

**Comment it out temporarily:**
```javascript
-- AND cg.grant_year >= YEAR(CURRENT_DATE()) - 3
```

This will show ALL grants regardless of year, helping you see if the year filter is the problem.

---

## 🔍 Diagnose First

Run the diagnostic queries in [DIAGNOSE-GRANTS-JOIN.sql](DIAGNOSE-GRANTS-JOIN.sql) and tell me:

1. **Query 1 result**: Do you see grants with real values?
2. **Query 5 result**: Does the direct join return any rows?
3. **Query 6 results**: Which version (A, B, C, or D) returns matches?
4. **Query 7 result**: What years are in your grant data?

Once you share these, I can tell you exactly which fix to use!

---

## 🛠️ Common Issue: Data Type Mismatch

**Problem:**
- `organisation_number` is BIGINT (e.g., `225971`)
- `funder_charity_id` is STRING (e.g., `"225971"`)
- Simple comparison fails

**Solution:**
Cast both to STRING:
```sql
ON CAST(pc.organisation_number AS STRING) = CAST(cg.funder_charity_id AS STRING)
```

---

## 🛠️ Common Issue: Leading/Trailing Spaces

**Problem:**
- `funder_charity_id` has spaces (e.g., `" 225971 "`)
- Even after casting, `"225971" != " 225971 "`

**Solution:**
```sql
ON CAST(pc.organisation_number AS STRING) = TRIM(cg.funder_charity_id)
```

---

## 🛠️ Common Issue: Wrong ID Field

**Problem:**
- Your grants table uses `registered_charity_number` not `organisation_number`
- These are different fields!

**Solution:**
```sql
ON CAST(pc.registered_charity_number AS STRING) = cg.funder_charity_id
```

---

## 🛠️ Common Issue: Year Format

**Problem:**
- `grant_year` is stored as STRING (e.g., `"2023"`)
- Numeric comparison fails

**Solution:**
```sql
AND CAST(cg.grant_year AS INT) >= YEAR(CURRENT_DATE()) - 3
```

Or if it's a date:
```sql
AND YEAR(cg.grant_year) >= YEAR(CURRENT_DATE()) - 3
```

---

## 🚀 Quick Test Query

Run this in Databricks to test your join:

```sql
SELECT
  pc.organisation_number,
  pc.registered_charity_number,
  pc.charity_name,
  cg.funder_charity_id,
  cg.recipient_name,
  cg.amount,
  cg.grant_year
FROM publicextract_charity pc
INNER JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = CAST(cg.funder_charity_id AS STRING)
WHERE pc.charity_name LIKE '%Foundation%'
  AND cg.amount IS NOT NULL
LIMIT 10;
```

**If this returns 0 rows**, the JOIN condition is wrong.

**Try alternatives:**
- Change `organisation_number` to `registered_charity_number`
- Add `TRIM()` around `funder_charity_id`
- Remove the WHERE clause to see if ANY charities match

---

## 📊 What to Look For

When you run the diagnostic queries, check:

### Query 5 Output (Direct Join Test):

**If returns 0 rows:**
❌ JOIN condition is completely wrong
→ Try Fix #2, #3, or #4

**If returns rows with nulls:**
❌ Year filter is too restrictive
→ Try Fix #4

**If returns rows with data:**
✅ JOIN works! Issue is elsewhere (probably in Format Results node)

---

## 💡 Pro Tip: Check Sample Funder IDs

Run this to see what a real funder_charity_id looks like:

```sql
SELECT DISTINCT
  funder_charity_id,
  COUNT(*) as grants_given
FROM charity_grants
WHERE amount IS NOT NULL
GROUP BY funder_charity_id
ORDER BY grants_given DESC
LIMIT 5;
```

Then check if those IDs exist in publicextract_charity:

```sql
SELECT
  organisation_number,
  registered_charity_number,
  charity_name
FROM publicextract_charity
WHERE organisation_number IN (
  -- Paste top funder IDs here
  123456, 234567, 345678
)
OR registered_charity_number IN (
  123456, 234567, 345678
);
```

---

## 🎯 Most Likely Fix

Based on common issues, try **Fix #1** first:

**In your SQL, change:**
```sql
LEFT JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = cg.funder_charity_id
```

**To:**
```sql
LEFT JOIN charity_grants cg
  ON CAST(pc.organisation_number AS STRING) = CAST(cg.funder_charity_id AS STRING)
```

Test and let me know if that works!

---

Run the diagnostic queries and share results if this doesn't fix it! 🔧

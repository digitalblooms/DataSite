# Fix: Duplicate Grants Issue

## The Problem: Cartesian Product 💥

When you join multiple one-to-many tables together, you get exponential duplicates!

### Example: Woodland Trust

```
Charity has:
- 10 classifications
- 5 areas of operation
- 20 real grants

Current query joins all together:
10 × 5 × 20 = 1,000 rows!

So each grant appears 50 times (10 classifications × 5 areas)
```

### Why This Happens

Your current SQL:
```sql
FROM charity
LEFT JOIN classifications  -- Produces 10 rows
LEFT JOIN areas           -- Each of those 10 becomes 5 = 50 rows
LEFT JOIN grants          -- Each of those 50 becomes 20 = 1,000 rows!
GROUP BY charity_id
COLLECT_LIST(grants)      -- Collects all 1,000 rows (including duplicates)
```

---

## The Solution: Pre-Aggregate Grants ✅

Use a **CTE (Common Table Expression)** to aggregate grants BEFORE joining:

```sql
WITH grants_data AS (
  -- Aggregate grants separately first
  SELECT
    funder_charity_id,
    COUNT(DISTINCT grant_index) as grants_given_count,
    COLLECT_LIST(grant_info) as recent_grants
  FROM charity_grants
  GROUP BY funder_charity_id
)

SELECT ...
FROM charity
LEFT JOIN classifications
LEFT JOIN areas
LEFT JOIN grants_data  -- Join to already-aggregated grants (1 row per charity!)
```

Now each charity has exactly ONE grants row (already aggregated), so no duplicates!

---

## The Fix

**Replace your entire WITH-GRANTS-build-sql.js** with:
📄 [FIX-DUPLICATE-GRANTS.js](FIX-DUPLICATE-GRANTS.js)

### What Changed:

1. **Added CTE** at the top:
   ```sql
   WITH grants_data AS (
     -- Pre-aggregate ALL grants per charity
     SELECT
       funder_charity_id,
       COUNT(DISTINCT grant_index) as grants_given_count,
       SUM(amount) as total_grants_given,
       COLLECT_LIST(...) as recent_grants
     FROM charity_grants
     GROUP BY funder_charity_id
   )
   ```

2. **Changed main query** to join to pre-aggregated data:
   ```sql
   LEFT JOIN grants_data
     ON CAST(pc.organisation_number AS STRING) = CAST(grants_data.funder_charity_id AS STRING)
   ```

3. **Added to GROUP BY** (since grants_data is pre-aggregated):
   ```sql
   GROUP BY
     ...,
     grants_data.grants_given_count,
     grants_data.recent_grants
   ```

---

## Benefits

### Before:
- ❌ Woodland Trust: 20 grants × 50 duplicates = 1,000 grant records
- ❌ Slow query (processing 50x more rows than needed)
- ❌ Incorrect grant counts

### After:
- ✅ Woodland Trust: 20 grants (no duplicates!)
- ✅ Faster query (no cartesian product)
- ✅ Correct grant counts on cards AND detail modal

---

## Test After Update

1. Search for "Woodland Trust"
2. **Card shows**: Real grant count (e.g., 23)
3. **Click** to open detail
4. **Grants tab**: 23 unique grants (no duplicates!)
5. **Pagination**: Works correctly (e.g., "Page 1 of 3")

---

## Why CTE Instead of Subquery?

Both work, but CTE is cleaner:

**CTE (Common Table Expression):**
```sql
WITH grants_data AS (...)
SELECT ... FROM charity LEFT JOIN grants_data
```
✅ Readable, defined at top
✅ Can be reused multiple times
✅ Easier to debug

**Subquery:**
```sql
SELECT ... FROM charity
LEFT JOIN (
  SELECT ... FROM grants GROUP BY ...
) grants_data
```
❌ Nested, harder to read
❌ Can't reuse
❌ Harder to debug

---

## Alternative: DISTINCT in COLLECT_LIST

If you can't use CTE, you could try:
```sql
COLLECT_LIST(DISTINCT STRUCT(...)) as recent_grants
```

But this is:
- ❌ Less efficient (still processes duplicates)
- ❌ Doesn't fix the count issue
- ❌ DISTINCT on STRUCT can be unreliable

**CTE is the proper solution.**

---

## Deploy

1. **Replace** your Build SQL Query node code with [FIX-DUPLICATE-GRANTS.js](FIX-DUPLICATE-GRANTS.js)
2. **Save** n8n workflow
3. **Test** with "Woodland Trust" or any grantmaker
4. **Verify**: No duplicate grants, correct counts

---

This fix solves BOTH issues:
- ✅ Grants count shows correctly on cards
- ✅ No duplicate grants in the list

Update that one file in n8n and you're done! 🎉

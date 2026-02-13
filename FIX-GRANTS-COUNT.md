# Fix: Grants Given Count Shows 0

## The Problem

Your SQL is counting `recipient_charity_id`, which is NULL in many grant records:

```sql
COUNT(DISTINCT cg.recipient_charity_id) as grants_given_count,
```

**Result**: Even charities with 100+ grants show "0" because all their recipient_charity_ids are NULL!

---

## The Fix

In your **WITH-GRANTS-build-sql.js**, find this line in the `buildSQLQuery` function (around line 223):

```sql
COUNT(DISTINCT cg.recipient_charity_id) as grants_given_count,
```

**Replace with:**
```sql
COUNT(DISTINCT CASE WHEN cg.amount IS NOT NULL THEN cg.grant_index END) as grants_given_count,
```

This counts grants that have an amount (real grants), using grant_index as the unique identifier.

### Alternative Fix (Simpler):

```sql
SUM(CASE WHEN cg.amount IS NOT NULL THEN 1 ELSE 0 END) as grants_given_count,
```

This simply counts rows where there's a grant amount.

---

## Why This Works

**Before:**
- Charity gave 150 grants
- But only 5 have recipient_charity_id filled in
- COUNT returns: **5** ❌

**After:**
- Charity gave 150 grants
- All have amount (required field)
- COUNT returns: **150** ✅

---

## Test It

After updating, search for a charity you know gives grants and check the card:

```
┌─────────────────────────────────────┐
│ Income        Grants Given    Area │
│ £5M           150             England│  ← Should show real number now!
└─────────────────────────────────────┘
```

---

Done! This fix + pagination are ready to go.

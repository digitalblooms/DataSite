# Fix: Grants Count Shows 0 + Add Pagination

## Issue 1: Grants Given Shows 0 ❌

**Problem:** Your SQL counts `recipient_charity_id`, which is often NULL!

```sql
COUNT(DISTINCT cg.recipient_charity_id) as grants_given_count,  -- WRONG!
```

Even if a charity gave grants, if `recipient_charity_id` is NULL, it doesn't count.

**Solution:** Count the grant record itself (not a nullable field):

In your **WITH-GRANTS-build-sql.js**, find this in the `buildSQLQuery` function:

```sql
COUNT(DISTINCT cg.recipient_charity_id) as grants_given_count,
```

**Replace with:**
```sql
COUNT(DISTINCT CASE WHEN cg.amount IS NOT NULL THEN cg.grant_index END) as grants_given_count,
```

Or simpler (counts all grant rows):
```sql
COUNT(CASE WHEN cg.funder_charity_id IS NOT NULL THEN 1 END) as grants_given_count,
```

This counts grants where there's actually grant data, not relying on recipient_charity_id.

---

## Issue 2: Add Pagination to Grants ✅

Users want to page through grants instead of seeing a huge list.

### Frontend Update:

I'll update the `populateGrantsTab` function to add pagination with 10 grants per page.

# Grant Filters Update

## New Search Capabilities

You can now search for charities based on their grantmaking activity:

### New Parameters

1. **`min_grants_given`** - Minimum number of grants given
2. **`max_grants_given`** - Maximum number of grants given
3. **`grant_year`** - Filter grants by specific year

## Example Queries

### Grant Count Filters
- **"Charities who have given over 50 grants"**
  ```json
  { "min_grants_given": 50 }
  ```

- **"Grantmakers with more than 100 grants"**
  ```json
  { "gives_grants": true, "min_grants_given": 100 }
  ```

- **"Funders who gave less than 20 grants"**
  ```json
  { "gives_grants": true, "max_grants_given": 20 }
  ```

### Year Filters
- **"Charities who have given over 50 grants in 2024"**
  ```json
  { "min_grants_given": 50, "grant_year": 2024 }
  ```

- **"Education funders who gave grants in 2023"**
  ```json
  { "classifications": ["education"], "gives_grants": true, "grant_year": 2023 }
  ```

### Combined Filters
- **"Large London grantmakers with over 30 grants in 2024"**
  ```json
  {
    "min_income": 1000000,
    "geographic_areas": ["London"],
    "gives_grants": true,
    "min_grants_given": 30,
    "grant_year": 2024
  }
  ```

## How It Works

### SQL Implementation

**Grant Count Filtering** (main query):
```sql
WHERE grants_data.grants_given_count >= 50
```

**Year Filtering** (in CTE before aggregation):
```sql
FROM charity_grants
WHERE amount IS NOT NULL AND grant_year = 2024
```

This ensures:
- ✅ Count filters work on the aggregated total
- ✅ Year filters apply before aggregation (accurate counts per year)
- ✅ Both can be combined for precise queries

## Files Updated

1. **SIMPLIFIED-gemini-prompt.txt**
   - Added grant filter parameters to JSON schema
   - Added GRANT FILTERS section with examples
   - Added 4 new example queries

2. **FIX-DUPLICATE-GRANTS.js**
   - Added `min_grants_given` WHERE clause
   - Added `max_grants_given` WHERE clause
   - Added `grant_year` filter parameter to buildSQLQuery()
   - Updated CTE to include year filter

## Deployment

Copy the updated files to your n8n workflow:
- **Gemini AI Node**: Use updated SIMPLIFIED-gemini-prompt.txt
- **Build SQL Query Node**: Use updated FIX-DUPLICATE-GRANTS.js

Test with: *"Charities who have given over 50 grants in 2024"*

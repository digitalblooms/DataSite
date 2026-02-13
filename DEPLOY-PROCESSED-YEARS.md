# Deploy: Processed Grant Years Feature

## What Changed

Added visual year coverage timeline showing which years have processed PDF grant data for each charity.

## Files Updated

### 1. **FIX-DUPLICATE-GRANTS.js** (n8n Build SQL Query node)
**Added to CTE:**
```sql
COLLECT_SET(grant_year) as processed_grant_years,
```

**Added to main SELECT:**
```sql
COALESCE(FIRST(grants_data.processed_grant_years), ARRAY()) as processed_grant_years,
```

This calculates the distinct years from existing `charity_grants` table - no new table/column needed!

### 2. **index.html** (Frontend)
Updated to use backend-provided `processed_grant_years` instead of calculating from grants.

**Change:**
```javascript
// Before (calculated from grants)
const yearsWithData = new Set(sortedYears.filter(y => y !== 'Unknown').map(y => parseInt(y)));

// After (from backend)
const processedYears = parseArray(charity.processed_grant_years).filter(y => y != null);
const yearsWithData = new Set(processedYears.map(y => parseInt(y)));
```

## Deployment Steps

### Step 1: Update n8n Build SQL Query Node
1. Open your n8n workflow
2. Find the **Build SQL Query** node
3. Replace ALL code with updated [FIX-DUPLICATE-GRANTS.js](FIX-DUPLICATE-GRANTS.js)
4. Save workflow

### Step 2: Update Website
1. Copy updated [index.html](index.html) to your repository
2. Commit and push to GitHub:
   ```bash
   git add index.html FIX-DUPLICATE-GRANTS.js
   git commit -m "Add processed grant years timeline"
   git push origin main
   ```
3. GitHub Pages will auto-deploy in 1-2 minutes

### Step 3: Test
1. Search for a charity with grants (e.g., "Quartet Community Foundation")
2. Click to open detail modal
3. Go to **Grants** tab
4. You should see:
   ```
   📄 Data Coverage          Years with processed PDF data
   ───────────────────────────────────────────────────────
     ○      ○      ✓      ✓      ✓      ✓      ✓
    2018   2019   2020   2021   2022   2023   2024
   ```

## How It Works

**Backend (SQL):**
- `COLLECT_SET(grant_year)` gets distinct years from `charity_grants` table
- Returns array like `[2020, 2021, 2022, 2023, 2024]`

**Frontend (JavaScript):**
- Displays last 7 years as timeline
- Green checkmark (✓) if year in `processed_grant_years`
- Gray circle (○) if year not processed

## Benefits

✅ Users can see data freshness at a glance
✅ No new database tables/columns needed
✅ Calculated from existing grant data
✅ Ready for filtering later (you can add filtering by processed years)

## Future Enhancement

When you add actual "PDF processed years" tracking (separate from grants), just:
1. Add a `processed_pdf_years` column to a table
2. Change SQL to use that instead of `COLLECT_SET(grant_year)`
3. Frontend code already works - just change the field name!

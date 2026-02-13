# SIMPLIFIED SETUP - Based on Actual Data

You've discovered that several tables are empty:
- ❌ **charity_strategy_tags** - No data (beneficiary_scope, thematic_tags, etc.)
- ❌ **charity_grants** - No data (can't show individual grants)
- ❌ **prospect_grantmakers** - Ignore for now

## What Actually Works ✅

Based on your query results, here's what has good data:

### Classifications (Query 1)
- **Education/training** - 45% of charities
- **Religious Activities** - 20%
- **Poverty relief** - 18%
- **Arts/culture** - 16%
- **Health** - 15%
- **Disability** - 15%
- **Amateur Sport** - 14%
- 18 categories total

### Postcodes (Query 5)
- Excellent distribution across UK
- SW: 3,525, SE: 3,458, OX: 3,093, etc.
- Perfect for geographic filtering

### Income (Query 6)
- Median: £20,341
- 75th percentile: £108,651
- Over £1M: 9,133 charities (good for "large" filter)
- £100K-£1M: 33,236 charities ("medium")
- Under £100K: 119,707 charities ("small")

### Grantmakers (Query 8)
- 21,273 charities where grantmaking is main activity
- Can filter on this, just can't show individual grants

---

## Update Your n8n Workflow

Replace these 3 nodes with the SIMPLIFIED versions:

### 1. Gemini AI Prompt Node

**Replace with:** [SIMPLIFIED-gemini-prompt.txt](SIMPLIFIED-gemini-prompt.txt)

Changes:
- ✅ Uses actual classification values from your data
- ✅ Correct income thresholds (£1M = large, £100K = medium)
- ✅ Better UK location mapping
- ❌ Removed beneficiary_scope (no data)
- ❌ Removed thematic_tags (no data)

### 2. Build SQL Query Node

**Replace JavaScript code with:** [SIMPLIFIED-build-sql.js](SIMPLIFIED-build-sql.js)

Changes:
- ✅ Maps user terms to actual classification values
- ✅ Smart postcode + county-based geographic search
- ✅ Uses `grant_making_is_main_activity` for grantmaker filter
- ❌ Removed charity_strategy_tags joins
- ❌ Removed charity_grants joins
- ❌ Simpler query = faster results

### 3. Format Results Node

**Replace JavaScript code with:** [SIMPLIFIED-format-results.js](SIMPLIFIED-format-results.js)

Changes:
- ✅ Properly handles Databricks array format
- ✅ Formats classifications and areas correctly
- ✅ Includes grantmaker flag
- ❌ Removed strategy tag fields
- ❌ Removed grants list fields

---

## Update Your Frontend (index.html)

Since Strategy and Grants tabs will be empty, you have 2 options:

### Option A: Keep Current Frontend (Recommended)
**No changes needed!** The current frontend handles missing data gracefully - it will show "No data available" for empty tabs. Users can still see Overview and Financials.

### Option B: Remove Empty Tabs
If you want to remove the Strategy and Grants tabs entirely, edit `index.html`:

**Line 649-651** - Remove these tabs:
```html
<!-- DELETE THESE TWO LINES -->
<button class="tab" onclick="switchTab(2)">Strategy</button>
<button class="tab" onclick="switchTab(3)">Grants</button>
```

**Lines 652-654** - Remove these tab panels:
```html
<!-- DELETE THESE TWO LINES -->
<div id="tab2" class="tab-panel"></div>
<div id="tab3" class="tab-panel"></div>
```

**Lines 1026-1148** - Delete the `populateStrategyTab` and `populateGrantsTab` functions (optional cleanup)

---

## Test the Simplified Version

After updating the 3 n8n nodes, test with these queries:

### Test Classifications
- ✅ "Education charities" → Should return ~84,000 results
- ✅ "Religious charities" → Should return ~37,000 results
- ✅ "Animal welfare" → Should return ~4,600 results

### Test Geographic Search
- ✅ "Charities in London" → Should filter by E, EC, N, NW, SE, SW, W, WC postcodes
- ✅ "Manchester charities" → Should filter by M postcodes
- ✅ "Charities in Kent" → Should filter by county name in areas_of_operation

### Test Income Filters
- ✅ "Large charities" → min_income: 1000000 (~9,000 results)
- ✅ "Small charities" → max_income: 100000 (~120,000 results)
- ✅ "Charities with income over 5 million" → min_income: 5000000

### Test Grantmakers
- ✅ "Grantmakers" → Should filter on grant_making_is_main_activity
- ✅ "Foundations" → Same filter
- ⚠️ Note: Won't show individual grants (that table is empty)

### Test Combined Queries
- ✅ "Large education charities in London"
- ✅ "Health charities with income over 1 million"
- ✅ "Religious organizations in Scotland"
- ✅ "Animal welfare grantmakers"

---

## Expected Results

### Before (Broken)
- ❌ Format Results crashes on Databricks response
- ❌ Strategy tab always empty (no data)
- ❌ Grants tab always empty (no data)
- ❌ Classification search doesn't match real values
- ❌ Slow queries joining empty tables

### After (Working)
- ✅ Format Results works perfectly
- ✅ Overview tab shows charity info, contact, classifications
- ✅ Financials tab shows income/expenditure breakdown
- ✅ Classification search matches actual database values
- ✅ Geographic search uses postcodes + counties
- ✅ Grantmaker filter works (just no grant details)
- ✅ Faster queries (fewer table joins)

---

## What You Can Search For

Based on actual data availability:

**✅ Can Search:**
- Charity names (full-text search)
- Income levels (£1M+, £100K-£1M, <£100K)
- Classifications (18 categories - education, health, etc.)
- Geographic location (cities via postcodes, counties via areas)
- Grantmakers (main activity flag)
- Has website (yes/no)

**❌ Cannot Search (No Data):**
- Beneficiaries (children, elderly, etc.) - strategy_tags empty
- Themes (education, health, etc. as tags) - strategy_tags empty
- Individual grants given - charity_grants empty
- Funding style - strategy_tags empty
- Desired outcomes - strategy_tags empty

---

## Quick Start

1. **Copy 3 files into n8n:**
   - [SIMPLIFIED-gemini-prompt.txt](SIMPLIFIED-gemini-prompt.txt) → Gemini node
   - [SIMPLIFIED-build-sql.js](SIMPLIFIED-build-sql.js) → Build SQL Query node
   - [SIMPLIFIED-format-results.js](SIMPLIFIED-format-results.js) → Format Results node

2. **Test with:** "Education charities in London"

3. **Expected result:** List of London-based education charities with:
   - Name, activities, income
   - Contact info (website, email, phone, postcode)
   - Classifications
   - Areas of operation

4. **Frontend:** No changes needed (or optionally remove empty tabs)

---

## Performance Improvement

Simplified query removes 2 empty table joins:

**Before:**
```sql
LEFT JOIN charity_strategy_tags cst ...
LEFT JOIN charity_grants cg ...
```

**After:**
```sql
-- Removed! Only join tables with data
```

**Result:**
- ⚡ Faster query execution
- ⚡ Simpler SQL
- ⚡ Easier to debug

---

## Future Enhancement

When you eventually load data into empty tables:

### When charity_grants fills up:
1. Uncomment grant joins in SQL
2. Add recent_grants field to format results
3. Re-enable Grants tab in frontend

### When charity_strategy_tags fills up:
1. Uncomment strategy tag joins
2. Add beneficiary/theme filtering to Gemini prompt
3. Add those fields to format results
4. Re-enable Strategy tab

Until then, the simplified version will work perfectly with your actual data!

---

Ready to update? Just replace the 3 n8n node contents and test!

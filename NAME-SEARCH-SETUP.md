# Name Search Setup Guide

I've added a toggle switch to your website! Users can now choose:
- **🤖 Natural Language** - AI-powered search (e.g., "large grantmakers in London")
- **🔍 Name Search** - Direct charity name search (e.g., "British Heart Foundation")

## ✅ Frontend - Already Done!

Your [index.html](index.html) now has:
- ✅ Toggle switch with two modes
- ✅ Dynamic placeholder text
- ✅ Sends `searchType` to webhook: `"natural"` or `"name"`

## 🔧 Backend - Update n8n Workflow

You have **two options**. Option 2 is better (faster + cheaper).

---

## Option 1: Simple (Update Build SQL Node Only)

**Pros:** No workflow restructuring needed
**Cons:** Still calls Gemini API for name searches (wastes time + money)

### Steps:

1. **Replace your Build SQL Query node code** with:
   - [NAME-SEARCH-build-sql.js](NAME-SEARCH-build-sql.js)

2. **Done!** The code checks `searchType` and:
   - If `"name"` → Bypasses AI parsing, searches by name only
   - If `"natural"` → Uses AI-parsed parameters like before

---

## Option 2: Optimal (Add IF Node - Skip Gemini)

**Pros:** Name searches skip Gemini (faster, no API cost)
**Cons:** Requires adding one node to workflow

### Workflow Structure:

```
Webhook
   ↓
  IF Node (Check searchType)
   ├─ searchType = "name" → Build SQL (Direct) → Databricks
   └─ searchType = "natural" → Gemini → Build SQL → Databricks
```

### Steps:

#### 1. Add IF Node After Webhook

1. Click **+** after your Webhook node
2. Add **IF** node (under "Flow" category)
3. **Configure:**
   - **Condition**: `{{ $json.body.searchType }}` equals `name`

#### 2. Route "True" Branch (Name Search)

For the **IF = True** branch:

1. Add a new **Code** node (call it "Build SQL - Name Search")
2. **Code:** Use the "Name Search" part from [NAME-SEARCH-build-sql.js](NAME-SEARCH-build-sql.js)

   Or use this simplified version:

```javascript
const webhookData = $('Webhook').first().json.body;
const query = webhookData.query;

const keywords = query
  .trim()
  .split(/\s+/)
  .filter(k => k.length > 2)
  .map(k => `LOWER(pc.charity_name) LIKE '%${k.toLowerCase().replace(/'/g, "''")}%'`)
  .join(' AND ');

const whereClauses = [
  "pc.charity_registration_status = 'Registered'",
  keywords ? `(${keywords})` : '1=1'
];

const sqlQuery = `
SELECT
  pc.organisation_number,
  pc.registered_charity_number,
  pc.charity_name,
  pc.charity_activities,
  pc.latest_income,
  pc.latest_expenditure,
  pc.charity_contact_web,
  pc.charity_contact_email,
  pc.charity_contact_phone,
  pc.charity_contact_postcode,
  pc.charity_contact_address1,
  pc.charity_contact_address2,
  pc.charity_contact_address3,

  COLLECT_SET(pcc.classification_description) as classifications,
  COLLECT_SET(pcao.geographic_area_description) as areas_of_operation,

  FIRST(pa.grant_making_is_main_activity) as is_grantmaker,
  FIRST(pb.expenditure_grants_institution) as expenditure_grants,
  FIRST(pb.income_donations_and_legacies) as income_donations,
  FIRST(pb.income_charitable_activities) as income_charitable

FROM publicextract_charity pc
LEFT JOIN publicextract_charity_classification pcc ON pc.organisation_number = pcc.organisation_number
LEFT JOIN publicextract_charity_area_of_operation pcao ON pc.organisation_number = pcao.organisation_number
LEFT JOIN publicextract_charity_annual_return_parta pa ON pc.organisation_number = pa.organisation_number AND pa.latest_fin_period_submitted_ind = true
LEFT JOIN publicextract_charity_annual_return_partb pb ON pc.organisation_number = pb.organisation_number AND pb.latest_fin_period_submitted_ind = true

WHERE ${whereClauses.join(' AND ')}

GROUP BY pc.organisation_number, pc.registered_charity_number, pc.charity_name, pc.charity_activities, pc.latest_income, pc.latest_expenditure, pc.charity_contact_web, pc.charity_contact_email, pc.charity_contact_phone, pc.charity_contact_postcode, pc.charity_contact_address1, pc.charity_contact_address2, pc.charity_contact_address3

ORDER BY pc.latest_income DESC
LIMIT 50
`.trim();

return [{ json: { sql_query: sqlQuery } }];
```

3. Connect this node to your **Databricks HTTP Request** node

#### 3. Route "False" Branch (Natural Language)

For the **IF = False** branch:

1. Keep your existing flow: **Gemini → Build SQL → Databricks**
2. Just connect the IF node's False branch to your existing Gemini node

#### 4. Merge Branches

Both branches should converge at the **Format Results** node after Databricks.

Your workflow will look like:

```
Webhook
   ↓
  IF (searchType = "name"?)
   ├─ True → Build SQL Name → Databricks ─┐
   └─ False → Gemini → Build SQL → Databricks ─┤
                                                 ↓
                                          Format Results
                                                 ↓
                                          Respond to Webhook
```

---

## 🧪 Testing

### Test Name Search:
1. Open your website
2. Click **🔍 Name Search** toggle
3. Type: "British Heart Foundation"
4. Should find: THE BRITISH HEART FOUNDATION quickly (no AI delay)

### Test Natural Language:
1. Click **🤖 Natural Language** toggle
2. Type: "Large education charities in London"
3. Should find: Education charities in London with income > £1M

---

## 📊 Performance Comparison

| Search Type | Speed | Cost | Use Case |
|------------|-------|------|----------|
| **Name Search** | ⚡ 1-2s | Free | "British Red Cross", "Oxfam", "Cancer Research UK" |
| **Natural Language** | 🐌 3-5s | ~$0.001 | "Large grantmakers in Manchester", "Animal welfare charities" |

---

## 🎨 UI Features

**Toggle Switch:**
- 🤖 Natural Language (default)
- 🔍 Name Search

**Dynamic Placeholders:**
- Natural: "Search charities... e.g., 'Large grantmakers supporting education in London'"
- Name: "Enter charity name... e.g., 'British Heart Foundation' or 'Oxfam'"

**Visual Feedback:**
- Active toggle is highlighted in blue
- Inactive toggle is gray
- Smooth transitions

---

## 🚀 Deploy Updated Frontend

Your [index.html](index.html) is already updated. Push to GitHub:

```bash
git add index.html NAME-SEARCH-*.js NAME-SEARCH-SETUP.md
git commit -m "Add name search toggle - users can search by charity name directly"
git push
```

GitHub Pages will redeploy in 1-2 minutes.

---

## 💡 Pro Tips

**When to use Name Search:**
- You know the exact charity name
- Faster results needed
- Searching well-known charities (Oxfam, Red Cross, etc.)

**When to use Natural Language:**
- Exploring by category, size, location
- Don't know exact names
- Need filtered/refined searches

---

## 🔮 Future Enhancements

**Autocomplete for Name Search:**
- As user types, suggest charity names
- Requires separate autocomplete API endpoint
- Could use Databricks with `LIMIT 10` for suggestions

**Combined Search:**
- Allow mixing: "British * Foundation" (wildcard search)
- Search within results

**Search History:**
- Remember recent searches
- Quick re-search buttons

---

Ready to deploy? The frontend is done, just update your n8n workflow with Option 1 or 2!

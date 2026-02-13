# Fix Webhook Response Array Wrapper

## Problem

The webhook is returning:
```json
[
  {
    "success": true,
    "count": 50,
    "results": [...]
  }
]
```

But frontend expects:
```json
{
  "success": true,
  "count": 50,
  "results": [...]
}
```

## Root Cause

Your **Respond to Webhook** node in n8n is configured to return all items, which wraps single items in an array.

## Solution: Update Respond to Webhook Node

### Option 1: Change Response Body (Recommended)

In your **Respond to Webhook** node:

1. **Response Body**: Change to use **first item only**

   **From:**
   ```
   {{ $json }}
   ```

   **To:**
   ```
   {{ $("Format Results").first().json }}
   ```

   This explicitly gets the first (and only) item from the Format Results node.

### Option 2: Use Expression

**Alternative Response Body:**
```
{{ $json }}
```

But in **Options** → **Respond With**: Select "First Incoming Item Only"

### Option 3: Fix in Format Results Code

At the very end of your Format Results code, change the return to unwrap the n8n format:

**Current (n8n format):**
```javascript
return [{
  json: {
    success: true,
    count: formattedResults.length,
    results: formattedResults
  }
}];
```

**Change to (direct object):**
```javascript
return {
  success: true,
  count: formattedResults.length,
  results: formattedResults
};
```

⚠️ **Warning**: This may break n8n's node chaining. Prefer Option 1 or 2.

---

## Alternative: Fix Frontend Instead

If you can't change n8n, update the frontend to handle the array:

**In index.html around line 698**, change:

**From:**
```javascript
const data = await response.json();

if (data.success && data.results) {
    currentResults = data.results;
    displayResults(data.results);
} else {
    throw new Error(data.error || 'Unknown error occurred');
}
```

**To:**
```javascript
let data = await response.json();

// Handle array wrapper from n8n
if (Array.isArray(data)) {
    data = data[0];
}

if (data.success && data.results) {
    currentResults = data.results;
    displayResults(data.results);
} else {
    throw new Error(data.error || 'Unknown error occurred');
}
```

---

## Recommended: Fix Both

1. **Fix n8n Respond to Webhook** (use Option 1 above)
2. **Add safety check to frontend** (handle array wrapper just in case)

This makes it robust regardless of n8n configuration changes.

---

## After Fixing

Test with any query. The frontend should now display results correctly.

Expected behavior:
- Results grid shows charity cards ✅
- Click on card opens detail modal ✅
- No JavaScript console errors ✅

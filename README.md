# UK Charity Explorer

A beautiful, AI-powered search interface for exploring UK charity data from the Charity Commission. Users can search using natural language queries, and an AI interprets their intent to find relevant charities.

![Preview](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=UK+Charity+Explorer)

## Features

- 🤖 **AI-Powered Search** - Natural language queries powered by Google Gemini
- 🎨 **Modern UI** - Clean, responsive design with smooth animations
- 📊 **Rich Data Display** - View financials, strategy, grants, and contact info
- 🔍 **Smart Filtering** - AI automatically applies the right filters
- 📱 **Mobile Friendly** - Works beautifully on all devices
- ⚡ **Fast** - Single-page application with no backend dependencies

## Architecture

```
┌─────────────┐         ┌──────────┐         ┌────────────┐
│   Browser   │────────▶│   n8n    │────────▶│ Databricks │
│ (index.html)│  POST   │ Webhook  │   SQL   │  Database  │
└─────────────┘         └──────────┘         └────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │  Gemini  │
                        │    AI    │
                        └──────────┘
```

### Components:

1. **Frontend** - Static HTML/CSS/JS hosted on GitHub Pages
2. **n8n Workflow** - Serverless backend for API orchestration
3. **Gemini AI** - Parses natural language into structured filters
4. **Databricks** - Data warehouse with charity information

## Quick Start

### Prerequisites

- GitHub account (for Pages hosting)
- n8n instance ([cloud](https://n8n.io) or [self-hosted](https://docs.n8n.io/hosting/))
- Databricks workspace with SQL endpoint
- Google AI Studio API key ([get one free](https://makersuite.google.com/app/apikey))

### Setup Steps

#### 1. Set Up n8n Webhook

Follow the detailed guide in [`N8N_SETUP.md`](./N8N_SETUP.md) to:
- Configure the 6-node workflow
- Connect to Databricks
- Set up Gemini AI
- Test the endpoint

Once complete, you'll have a webhook URL like:
```
https://your-n8n-instance.app.n8n.cloud/webhook/charity-search
```

#### 2. Configure Frontend

Edit `index.html` and update the webhook URL (line 738):

```javascript
// Configuration - UPDATE THIS WITH YOUR N8N WEBHOOK URL
const WEBHOOK_URL = 'https://your-n8n-instance.app.n8n.cloud/webhook/charity-search';
```

#### 3. Test Locally

Open `index.html` in your browser:

```bash
open index.html
# or
python -m http.server 8000
# then visit http://localhost:8000
```

Try some test queries:
- "Large grantmakers in London"
- "Education charities helping children"
- "Animal welfare organizations"

#### 4. Deploy to GitHub Pages

**Option A: Using GitHub Web Interface**

1. Create a new repository on GitHub
2. Click **Upload files**
3. Drag and drop `index.html`
4. Commit the changes
5. Go to **Settings** → **Pages**
6. Under **Source**, select `main` branch
7. Click **Save**
8. Your site will be live at `https://your-username.github.io/repo-name/`

**Option B: Using Git Command Line**

```bash
# Initialize git repo
cd /Users/g.rogers/Downloads/DataWebsite
git init

# Add files
git add index.html README.md N8N_SETUP.md Schema.csv

# Create first commit
git commit -m "Initial commit: UK Charity Explorer"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/your-username/charity-explorer.git

# Push to GitHub
git branch -M main
git push -u origin main

# Enable GitHub Pages (or do this in web interface)
```

**Enable GitHub Pages:**
1. Go to your repo on GitHub
2. Click **Settings** → **Pages**
3. Source: Deploy from `main` branch
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Visit your site at `https://your-username.github.io/charity-explorer/`

#### 5. Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to your repo with your domain:
   ```bash
   echo "charities.yourdomain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

2. Configure DNS with your domain provider:
   - Add CNAME record pointing to `your-username.github.io`

3. In GitHub Settings → Pages, enter your custom domain

4. Enable **Enforce HTTPS**

## Usage Examples

### Example Queries

The AI understands natural language. Try queries like:

**By Size:**
- "Large charities" (income > £1M)
- "Small local charities" (income < £100K)
- "Medium-sized organizations"

**By Location:**
- "Charities in London"
- "Organizations operating in Scotland"
- "Manchester-based charities"

**By Theme:**
- "Education charities"
- "Environmental organizations"
- "Health and wellbeing charities"
- "Animal welfare groups"

**By Beneficiary:**
- "Charities helping children"
- "Organizations supporting elderly people"
- "Charities for homeless people"

**By Grant-Making:**
- "Grantmakers"
- "Foundations that give grants"
- "Charities that fund other charities"

**Combined Queries:**
- "Large grantmakers in London supporting education"
- "Environmental charities helping endangered species"
- "Health charities with income over 5 million"
- "Foundations funding arts and culture in Yorkshire"

### Search Tips

1. **Be Specific**: More specific queries get better results
   - ❌ "Charities"
   - ✅ "Education charities in Birmingham"

2. **Use Common Terms**: Stick to recognizable categories
   - ✅ "Education, health, poverty, animals, environment"
   - ❌ "Esoteric niche subcategories"

3. **Combine Filters**: You can mix multiple criteria
   - ✅ "Large grantmakers supporting disabled people in Wales"

4. **Natural Language**: Write how you'd speak
   - ✅ "Charities that help homeless people in London"
   - ✅ "London charities for homelessness"
   - Both work!

## File Structure

```
DataWebsite/
├── index.html          # Complete single-page application
├── README.md           # This file
├── N8N_SETUP.md        # Detailed n8n workflow setup
└── Schema.csv          # Database schema reference
```

## Database Schema

The search covers multiple tables:

- **publicextract_charity** - Core charity information
- **charity_grants** - Grant-making data (who funds whom)
- **charity_strategy_tags** - Strategy, beneficiaries, themes
- **publicextract_charity_classification** - Charity categories
- **publicextract_charity_area_of_operation** - Geographic data
- **publicextract_charity_annual_return_partb** - Financial details

See [`Schema.csv`](./Schema.csv) for complete field listing.

## Customization

### Styling

The design uses CSS variables for easy theming. Edit `index.html` around line 9:

```css
:root {
    --primary: #3B82F6;        /* Primary blue */
    --success: #10B981;        /* Green */
    --warning: #F59E0B;        /* Amber */
    --danger: #EF4444;         /* Red */
    /* ... */
}
```

### Search Parameters

To adjust what the AI can search for, edit the Gemini prompt in n8n (see `N8N_SETUP.md`).

### Results Limit

Default is 50 results. To change, edit the SQL query in n8n:

```sql
LIMIT 50  -- Change to 25, 100, etc.
```

### Result Card Layout

To customize what's shown on cards, edit the `createCharityCard()` function in `index.html` (around line 921).

## Troubleshooting

### "Search failed" Error

**Check:**
1. Is the webhook URL correct in `index.html`?
2. Is the n8n workflow active?
3. Open browser console (F12) - what's the actual error?
4. Test the webhook directly with cURL (see N8N_SETUP.md)

### No Results Found

**Try:**
1. Broader search terms (e.g., "education" instead of "secondary education for disadvantaged youth")
2. Check your Databricks tables have data
3. Look at n8n execution logs - is the SQL query too restrictive?

### Slow Responses

**Optimize:**
1. Reduce result limit from 50 to 25
2. Use a larger Databricks warehouse
3. Add database indexes on frequently queried columns
4. Cache common queries in n8n

### AI Misinterprets Query

**Fix:**
1. Be more explicit in your search
2. Refine the Gemini prompt in n8n to handle edge cases
3. Add example queries to the prompt

## Performance

- **Frontend**: Static site, loads in <1s
- **Backend**: ~2-5s per search depending on:
  - Gemini API latency (~500ms)
  - Databricks query time (~1-3s)
  - n8n processing (~200ms)
- **Scaling**: Handles hundreds of concurrent users (limited by n8n/Databricks capacity)

## Cost Estimate

For ~1000 searches/month:

- **GitHub Pages**: Free
- **n8n Cloud**: $20/month (starter plan)
- **Gemini API**: ~$0.10/month (extremely cheap)
- **Databricks**: $1-10/month depending on warehouse size

**Total: ~$21-30/month** for a production POC

## Security Considerations

### Current Setup (POC)

- ✅ Frontend is static (no vulnerabilities)
- ✅ No user data stored
- ⚠️ Webhook is public (anyone can call it)
- ⚠️ No rate limiting

### For Production

Consider adding:

1. **API Key Authentication**
   ```javascript
   headers: {
     'X-API-Key': 'your-secret-key'
   }
   ```

2. **Rate Limiting** in n8n (use Redis or similar)

3. **CORS Configuration** to restrict domains

4. **Input Validation** to prevent SQL injection (current setup is safe but adds defense-in-depth)

5. **Monitoring** with n8n webhook logs or external service

## Roadmap

Potential enhancements:

- [ ] Advanced filters UI (income sliders, checkboxes)
- [ ] Save/share search results
- [ ] Export to CSV/PDF
- [ ] Charity comparison tool
- [ ] Favorites/bookmarking
- [ ] Search history
- [ ] Analytics dashboard
- [ ] Email alerts for new charities matching criteria
- [ ] Integration with other charity data sources

## Contributing

This is a POC project. To improve:

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is provided as-is for educational and POC purposes.

**Data Source**: UK Charity Commission public data
**Note**: Ensure compliance with Charity Commission data usage terms

## Support

- **n8n Issues**: [n8n Community](https://community.n8n.io/)
- **Databricks**: [Documentation](https://docs.databricks.com/)
- **GitHub Pages**: [Docs](https://docs.github.com/en/pages)

## Acknowledgments

- UK Charity Commission for public data
- n8n for workflow automation
- Google for Gemini AI
- Databricks for data warehousing

---

**Built with ❤️ for the nonprofit sector**

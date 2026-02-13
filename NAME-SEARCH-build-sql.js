// UPDATED Build SQL Query - Handles both Natural Language and Direct Name Search
// Checks searchType from webhook: "natural" or "name"

const webhookData = $('Webhook').first().json.body;
const searchType = webhookData.searchType || 'natural';
const query = webhookData.query;

console.log('Search Type:', searchType);
console.log('Query:', query);

try {
  let whereClauses = [
    "pc.charity_registration_status = 'Registered'"
  ];

  // ============================================================================
  // DIRECT NAME SEARCH (Bypass AI)
  // ============================================================================
  if (searchType === 'name') {
    console.log('Using direct name search - bypassing AI');

    // Split query into keywords and search
    const keywords = query
      .trim()
      .split(/\s+/)
      .filter(k => k.length > 2) // Ignore very short words
      .map(k => `LOWER(pc.charity_name) LIKE '%${k.toLowerCase().replace(/'/g, "''")}%'`)
      .join(' AND ');

    if (keywords) {
      whereClauses.push(`(${keywords})`);
    }

    // Build simple SQL for name search
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

LEFT JOIN publicextract_charity_classification pcc
  ON pc.organisation_number = pcc.organisation_number

LEFT JOIN publicextract_charity_area_of_operation pcao
  ON pc.organisation_number = pcao.organisation_number

LEFT JOIN publicextract_charity_annual_return_parta pa
  ON pc.organisation_number = pa.organisation_number
  AND pa.latest_fin_period_submitted_ind = true

LEFT JOIN publicextract_charity_annual_return_partb pb
  ON pc.organisation_number = pb.organisation_number
  AND pb.latest_fin_period_submitted_ind = true

WHERE ${whereClauses.join(' AND ')}

GROUP BY
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
  pc.charity_contact_address3

ORDER BY pc.latest_income DESC

LIMIT 50
    `.trim();

    return [{
      json: {
        sql_query: sqlQuery,
        search_type: 'name',
        query: query
      }
    }];
  }

  // ============================================================================
  // NATURAL LANGUAGE SEARCH (Use AI-parsed parameters)
  // ============================================================================
  console.log('Using natural language search - parsing AI response');

  let aiResponse;
  const input = $input.first().json;

  // Extract AI response from Gemini
  if (input.message?.content) {
    aiResponse = input.message.content;
  } else if (input.text) {
    aiResponse = input.text;
  } else if (input.output) {
    aiResponse = input.output;
  } else {
    aiResponse = input.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  if (!aiResponse) {
    throw new Error('Could not extract AI response');
  }

  // Clean and parse JSON
  aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const params = JSON.parse(aiResponse);

  console.log('Parsed AI parameters:', params);

  // Build WHERE clauses from AI parameters (same as SIMPLIFIED-build-sql.js)

  // Charity name keywords
  if (params.charity_name_keywords?.length) {
    const keywords = params.charity_name_keywords
      .map(k => `LOWER(pc.charity_name) LIKE '%${k.toLowerCase().replace(/'/g, "''")}%'`)
      .join(' OR ');
    whereClauses.push(`(${keywords})`);
  }

  // Income filters
  if (params.min_income) {
    whereClauses.push(`pc.latest_income >= ${params.min_income}`);
  }
  if (params.max_income) {
    whereClauses.push(`pc.latest_income <= ${params.max_income}`);
  }

  // Classifications
  if (params.classifications?.length) {
    const classificationConditions = params.classifications.map(c => {
      const clean = c.toLowerCase().replace(/'/g, "''");

      const mappings = {
        'education': 'Education/training',
        'religious': 'Religious Activities',
        'religion': 'Religious Activities',
        'poverty': 'Prevention Or Relief Of Poverty',
        'arts': 'Arts/culture/heritage/science',
        'culture': 'Arts/culture/heritage/science',
        'health': 'Advancement Of Health Or Saving Of Lives',
        'disability': 'Disability',
        'sport': 'Amateur Sport',
        'sports': 'Amateur Sport',
        'community': 'Economic/community Development/employment',
        'employment': 'Economic/community Development/employment',
        'environment': 'Environment/conservation/heritage',
        'conservation': 'Environment/conservation/heritage',
        'recreation': 'Recreation',
        'overseas': 'Overseas Aid/famine Relief',
        'housing': 'Accommodation/housing',
        'human rights': 'Human Rights/religious Or Racial Harmony/equality Or Diversity',
        'equality': 'Human Rights/religious Or Racial Harmony/equality Or Diversity',
        'animals': 'Animals',
        'armed forces': 'Armed Forces/emergency Service Efficiency'
      };

      for (const [key, value] of Object.entries(mappings)) {
        if (clean.includes(key)) {
          return `LOWER(pcc.classification_description) LIKE '%${value.toLowerCase().replace(/'/g, "''")}%'`;
        }
      }

      return `LOWER(pcc.classification_description) LIKE '%${clean}%'`;
    });

    whereClauses.push(`(${classificationConditions.join(' OR ')})`);
  }

  // Geographic search
  if (params.geographic_areas?.length) {
    const geoConditions = params.geographic_areas.map(area => {
      const areaClean = area.toLowerCase().replace(/'/g, "''");

      const postcodeMap = {
        'london': ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'],
        'manchester': ['M'],
        'birmingham': ['B'],
        'liverpool': ['L'],
        'leeds': ['LS'],
        'sheffield': ['S'],
        'bristol': ['BS'],
        'glasgow': ['G'],
        'edinburgh': ['EH'],
        'cardiff': ['CF'],
        'belfast': ['BT'],
        'newcastle': ['NE'],
        'nottingham': ['NG']
      };

      for (const [city, postcodes] of Object.entries(postcodeMap)) {
        if (areaClean.includes(city)) {
          const postcodeChecks = postcodes.map(pc =>
            `pc.charity_contact_postcode LIKE '${pc}%'`
          ).join(' OR ');
          return `(${postcodeChecks})`;
        }
      }

      if (areaClean.includes('scotland')) {
        return `(pc.charity_contact_postcode LIKE 'EH%' OR pc.charity_contact_postcode LIKE 'G%')`;
      }
      if (areaClean.includes('wales')) {
        return `(pc.charity_contact_postcode LIKE 'CF%' OR pc.charity_contact_postcode LIKE 'SA%')`;
      }

      return `(
        LOWER(pc.charity_contact_address1) LIKE '%${areaClean}%' OR
        LOWER(pc.charity_contact_address2) LIKE '%${areaClean}%' OR
        UPPER(pc.charity_contact_postcode) LIKE '${area.toUpperCase().replace(/'/g, "''")}%'
      )`;
    });

    whereClauses.push(`(${geoConditions.join(' OR ')})`);
  }

  // Grantmaker filter
  if (params.gives_grants === true) {
    whereClauses.push(`pa.grant_making_is_main_activity = true`);
  }

  // Website filter
  if (params.has_website === true) {
    whereClauses.push(`pc.charity_contact_web IS NOT NULL AND pc.charity_contact_web != ''`);
  }

  const whereClause = whereClauses.join(' AND ');

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

LEFT JOIN publicextract_charity_classification pcc
  ON pc.organisation_number = pcc.organisation_number

LEFT JOIN publicextract_charity_area_of_operation pcao
  ON pc.organisation_number = pcao.organisation_number

LEFT JOIN publicextract_charity_annual_return_parta pa
  ON pc.organisation_number = pa.organisation_number
  AND pa.latest_fin_period_submitted_ind = true

LEFT JOIN publicextract_charity_annual_return_partb pb
  ON pc.organisation_number = pb.organisation_number
  AND pb.latest_fin_period_submitted_ind = true

WHERE ${whereClause}

GROUP BY
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
  pc.charity_contact_address3

ORDER BY pc.latest_income DESC

LIMIT 50
  `.trim();

  return [{
    json: {
      sql_query: sqlQuery,
      search_type: 'natural',
      parsed_params: params
    }
  }];

} catch (error) {
  console.error('Error building SQL:', error);

  return [{
    json: {
      error: `Failed to build query: ${error.message}`,
      search_type: searchType,
      query: query
    }
  }];
}

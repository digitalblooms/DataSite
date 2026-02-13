// Format Results - WITH GRANTS DATA
// Now properly formats grants from charity_grants table!

const input = $input.all();

// Handle array or single response
let response;
if (Array.isArray(input[0].json)) {
  response = input[0].json[0];
} else {
  response = input[0].json;
}

// Check for query errors
if (response.status?.state !== 'SUCCEEDED') {
  return [{
    json: {
      success: false,
      error: 'Query failed: ' + (response.status?.error?.message || 'Unknown error'),
      results: []
    }
  }];
}

// Extract results
const result = response.result;
if (!result || !result.data_array || result.data_array.length === 0) {
  return [{
    json: {
      success: true,
      count: 0,
      results: []
    }
  }];
}

// Get column names from schema
const columns = response.manifest?.schema?.columns?.map(c => c.name) || [];

// Helper: Parse array fields (Databricks returns them as JSON strings)
function parseArrayField(value) {
  if (!value || value === 'null' || value === null) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Helper: Parse numbers (handles scientific notation strings like "3.989E8")
function parseNumber(value) {
  if (value === null || value === 'null' || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

// Helper: Parse boolean
function parseBoolean(value) {
  if (value === null || value === 'null' || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

// Helper: Parse grants array
function parseGrantsArray(value) {
  const grants = parseArrayField(value);

  // Filter out grants with all null values
  return grants.filter(grant => {
    if (!grant) return false;
    // Check if grant has at least one non-null value
    return grant.recipient_name || grant.amount || grant.grant_year;
  }).map(grant => ({
    recipient_name: grant.recipient_name || 'Unknown Recipient',
    recipient_charity_id: grant.recipient_charity_id,
    amount: parseNumber(grant.amount),
    grant_year: grant.grant_year
  }));
}

// Convert array rows to objects
const results = result.data_array.map(row => {
  const charity = {};
  columns.forEach((col, index) => {
    charity[col] = row[index];
  });
  return charity;
});

// Format for frontend
const formattedResults = results.map(charity => {
  return {
    // IDs
    organisation_number: charity.organisation_number,
    registered_charity_number: charity.registered_charity_number,

    // Basic info
    charity_name: charity.charity_name,
    charity_activities: charity.charity_activities,

    // Financials
    latest_income: parseNumber(charity.latest_income),
    latest_expenditure: parseNumber(charity.latest_expenditure),
    income_donations: parseNumber(charity.income_donations),
    income_charitable: parseNumber(charity.income_charitable),
    expenditure_grants: parseNumber(charity.expenditure_grants),

    // Contact
    charity_contact_web: charity.charity_contact_web,
    charity_contact_email: charity.charity_contact_email,
    charity_contact_phone: charity.charity_contact_phone,
    charity_contact_postcode: charity.charity_contact_postcode,
    charity_contact_address1: charity.charity_contact_address1,
    charity_contact_address2: charity.charity_contact_address2,
    charity_contact_address3: charity.charity_contact_address3,

    // Arrays
    classifications: parseArrayField(charity.classifications),
    areas_of_operation: parseArrayField(charity.areas_of_operation),

    // Grantmaker flag
    is_grantmaker: parseBoolean(charity.is_grantmaker),

    // GRANTS DATA (NOW INCLUDED!)
    grants_given_count: parseNumber(charity.grants_given_count) || 0,
    total_grants_given: parseNumber(charity.total_grants_given) || 0,
    latest_grant_year: charity.latest_grant_year,
    processed_grant_years: parseArrayField(charity.processed_grant_years),
    recent_grants: parseGrantsArray(charity.recent_grants),

    // SUBSIDIARIES DATA
    subsidiaries: parseArrayField(charity.subsidiaries_list).filter(s => s && s.subsidiary_org_number).map(s => ({
      organisation_number: s.subsidiary_org_number,
      name: s.subsidiary_name,
      income: parseNumber(s.subsidiary_income),
      expenditure: parseNumber(s.subsidiary_expenditure),
      subsidiary_number: s.subsidiary_number
    }))
  };
});

return [{
  json: {
    success: true,
    count: formattedResults.length,
    results: formattedResults
  }
}];

export default async function handler(request, response) {
  // Handle CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'GET') {
    const { key } = request.query;
    
    if (!key) {
      return response.status(400).json({
        valid: false,
        message: 'License key is required. Use ?key=YOUR_LICENSE_KEY'
      });
    }

    // Your license validation logic
    const isValid = await validateLicense(key);
    
    return response.status(200).json({
      valid: isValid,
      message: isValid ? 'License is valid' : 'Invalid license key',
      key: key,
      timestamp: new Date().toISOString()
    });
  }

  // Handle POST requests too
  if (request.method === 'POST') {
    const { key } = request.body;
    
    const isValid = await validateLicense(key);
    
    return response.status(200).json({
      valid: isValid,
      message: isValid ? 'License is valid' : 'Invalid license key'
    });
  }

  // Method not allowed
  return response.status(405).json({
    error: 'Method not allowed. Use GET or POST.'
  });
}

async function validateLicense(key) {
  // Your actual validation logic here
  // Example: Check against a database or hardcoded list
  
  const validKeys = [
    'SaaSYPRO-2024-001',
    'SaaSYPRO-2024-002', 
    'SaaSYPRO-2024-003'
  ];
  
  return validKeys.includes(key);
}

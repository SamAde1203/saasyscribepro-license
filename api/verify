import { promises as fs } from 'fs';
import path from 'path';

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

    try {
      const isValid = await validateLicense(key);
      
      return response.status(200).json({
        valid: isValid,
        message: isValid ? 'License is valid' : 'Invalid license key',
        key: key,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return response.status(500).json({
        valid: false,
        message: 'Error validating license'
      });
    }
  }

  return response.status(405).json({
    error: 'Method not allowed. Use GET.'
  });
}

async function validateLicense(key) {
  try {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const data = await fs.readFile(licensesPath, 'utf8');
    const licenses = JSON.parse(data);
    
    const license = licenses[key];
    return license && license.active === true;
  } catch (error) {
    // If file doesn't exist or other error, assume invalid
    return false;
  }
}

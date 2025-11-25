export default async function handler(req, res) {
  const { key } = req.query;
  
  // Hardcoded valid keys - update these with real customer keys
  const validKeys = [
    'SSP-001', 'SSP-002', 'SSP-003', 'SSP-004', 'SSP-005',
    'SSP-006', 'SSP-007', 'SSP-008', 'SSP-009', 'SSP-010'
  ];
  
  if (validKeys.includes(key)) {
    res.status(200).send('VALID');
  } else {
    res.status(404).send('INVALID');
  }
}

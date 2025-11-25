import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://YOUR-ACTUAL-PROJECT-ID.supabase.co',  // ← REPLACE THIS
  'YOUR-ACTUAL-ANON-KEY'  // ← REPLACE THIS
);

export default async function handler(req, res) {
  const { key } = req.query;

  if (!key) {
    return res.status(400).send('MISSING_KEY');
  }

  // Check license in Supabase
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', key)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return res.status(404).send('INVALID');
  }

  // Update usage count
  await supabase
    .from('licenses')
    .update({ used_count: data.used_count + 1 })
    .eq('id', data.id);

  res.status(200).send('VALID');
}

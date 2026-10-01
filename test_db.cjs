const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://kkoxfvrwpkmnlqgfxxlj.supabase.co', 'sb_publishable_RMZaNrHoo8_HiOe4Ftj0RA_EE7ZgAqT');
async function run() {
  const { data, error } = await sb.from('articles').select('*').eq('issue', 'S1201-9712(26)X2006-9');
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : 0);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();

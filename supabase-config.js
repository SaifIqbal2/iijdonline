window.SUPABASE_CONFIG = {
  url: 'https://kkoxfvrwpkmnlqgfxxlj.supabase.co',
  anonKey: 'sb_publishable_RMZaNrHoo8_HiOe4Ftj0RA_EE7ZgAqT'
};

if (!window.supabase) {
  throw new Error('Supabase JS SDK is not loaded. Include the Supabase CDN script before supabase-config.js.');
}

window.supabaseClient = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

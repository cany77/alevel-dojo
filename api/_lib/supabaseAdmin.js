import { createClient } from "@supabase/supabase-js";

export function getRequiredEnv(name, aliases = []) {
  const names = [name, ...aliases];
  const found = names.find((candidate) => process.env[candidate]);
  if (!found) {
    const error = new Error(`Missing environment variable: ${name}`);
    error.code = "MISSING_ENV";
    error.missing = name;
    throw error;
  }
  return process.env[found];
}

export function supabaseHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

export function createSupabaseAdmin() {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]);
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
    url: supabaseUrl,
  };
}

export async function getUserFromAccessToken(accessToken) {
  const { client } = createSupabaseAdmin();
  const { data, error } = await client.auth.getUser(accessToken);
  if (error) return null;
  return data.user || null;
}

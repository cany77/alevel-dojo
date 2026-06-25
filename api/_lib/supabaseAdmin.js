const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://rodgmxqefidixwyawwzv.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function requireSupabaseAdmin() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { url: SUPABASE_URL, key: SERVICE_ROLE_KEY };
}

export async function getUserFromAccessToken(accessToken) {
  const admin = requireSupabaseAdmin();
  const response = await fetch(`${admin.url}/auth/v1/user`, {
    headers: {
      apikey: admin.key,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function upsertSubscription(row) {
  const admin = requireSupabaseAdmin();
  const response = await fetch(`${admin.url}/rest/v1/user_subscriptions?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: admin.key,
      Authorization: `Bearer ${admin.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      ...row,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase subscription upsert failed: ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

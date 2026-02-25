import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOMENCE_AUTH_HEADER = 'Basic YXBpLTEzNzUyLW0zOHE2d25nb0VzUGZGM3k6RUNFdGY0S3VtV3hRbjVhbUhSMjV2NHh4OUNrR0UyMWw=';
const MOMENCE_TOKEN_URL = 'https://api.momence.com/api/v2/auth/token';

// In-memory token cache (lives for the lifetime of an invocation, but Supabase
// reuses function instances so this does reduce redundant auth round-trips).
let cachedToken: string | null = null;
let cachedTokenExpiry = 0; // unix ms

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }

  // Try with stored refresh token first (env var), fall back to password grant
  const refreshToken = Deno.env.get('MOMENCE_REFRESH_TOKEN');
  if (refreshToken) {
    try {
      const res = await fetch(MOMENCE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': MOMENCE_AUTH_HEADER,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          cachedToken = data.accessToken;
          cachedTokenExpiry = data.accessTokenExpiresAt
            ? new Date(data.accessTokenExpiresAt).getTime()
            : now + 3600_000;
          return cachedToken!;
        }
      }
    } catch {
      // fall through to password grant
    }
  }

  // Password grant
  const username = Deno.env.get('MOMENCE_USERNAME') || 'jimmygonda@gmail.com';
  const password = Deno.env.get('MOMENCE_PASSWORD') || 'Jimmeey@123';
  const res = await fetch(MOMENCE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'authorization': MOMENCE_AUTH_HEADER,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Momence auth failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  if (!data.accessToken) throw new Error('No accessToken in Momence auth response');
  cachedToken = data.accessToken;
  cachedTokenExpiry = data.accessTokenExpiresAt
    ? new Date(data.accessTokenExpiresAt).getTime()
    : Date.now() + 3600_000;
  return cachedToken!;
}

async function searchMembers(
  accessToken: string,
  query: string,
  hostId: number,
  pageSize = 20,
): Promise<unknown[]> {
  const params = new URLSearchParams({
    page: '0',
    pageSize: String(pageSize),
    sortOrder: 'DESC',
    sortBy: 'firstSeenAt',
  });
  if (query.trim()) params.append('search', query.trim());

  const url = `https://api.momence.com/api/v2/host/members?${params}`;
  const res = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${accessToken}`,
      'x-host-id': String(hostId),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Momence members API failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.payload ?? [];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query = '', hostId = 33905, pageSize = 20 } = body as {
      query?: string;
      hostId?: number;
      pageSize?: number;
    };

    const accessToken = await getAccessToken();
    const members = await searchMembers(accessToken, query, hostId, pageSize);

    // Return a slim payload (only the fields the autocomplete needs)
    const slim = (members as any[]).map((m: any) => ({
      id: m.id,
      firstName: m.firstName || '',
      lastName: m.lastName || '',
      email: m.email || '',
      phoneNumber: m.phoneNumber || '',
      pictureUrl: m.pictureUrl || null,
    }));

    return new Response(JSON.stringify({ members: slim }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('[momence-proxy] error:', err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

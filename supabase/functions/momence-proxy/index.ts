import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MOMENCE_BASE_URL = "https://api.momence.com/api/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory token cache — reused across warm invocations
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function authenticate(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  // MOMENCE_AUTH_TOKEN = Base64 credential part only (without "Basic " prefix)
  const authToken =
    Deno.env.get("MOMENCE_AUTH_TOKEN") ||
    "YXBpLTEzNzUyLW0zOHE2d25nb0VzUGZGM3k6RUNFdGY0S3VtV3hRbjVhbUhSMjV2NHh4OUNrR0UyMWw=";

  const username = Deno.env.get("MOMENCE_USERNAME") || "jimmygonda@gmail.com";
  const password = Deno.env.get("MOMENCE_PASSWORD") || "Jimmeey@123";

  const res = await fetch(`${MOMENCE_BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${authToken}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "password", username, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Momence auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  // Momence returns snake_case: access_token + expires_in (seconds)
  if (!data.access_token) {
    throw new Error(`No access_token in Momence auth response. Keys: ${Object.keys(data).join(", ")}`);
  }

  cachedAccessToken = data.access_token as string;
  tokenExpiresAt = Date.now() + ((data.expires_in ?? 3600) * 1000);
  return cachedAccessToken!;
}

// ── Secondary: full member detail ─────────────────────────────────────────────
async function fetchMemberDetail(token: string, memberId: number, hostId: number): Promise<any> {
  try {
    const res = await fetch(`${MOMENCE_BASE_URL}/host/members/${memberId}`, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "x-host-id": String(hostId),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ── Secondary: active memberships ─────────────────────────────────────────────
async function fetchMemberMemberships(token: string, memberId: number, hostId: number): Promise<any[]> {
  try {
    const params = new URLSearchParams({ page: "0", pageSize: "200", includeFrozen: "true" });
    const res = await fetch(
      `${MOMENCE_BASE_URL}/host/members/${memberId}/bought-memberships/active?${params}`,
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "x-host-id": String(hostId),
        },
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.payload ?? [];
  } catch { return []; }
}

// ── Secondary: member session history ─────────────────────────────────────────
async function fetchMemberSessionHistory(token: string, memberId: number, hostId: number): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      page: "0",
      pageSize: "100",
      sortOrder: "DESC",
      sortBy: "startsAt",
      includeCancelled: "false",
    });
    const res = await fetch(
      `${MOMENCE_BASE_URL}/host/members/${memberId}/sessions?${params}`,
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "x-host-id": String(hostId),
        },
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.payload ?? [];
  } catch { return []; }
}

async function searchMembers(
  accessToken: string,
  query: string,
  hostId: number,
  pageSize = 20,
): Promise<unknown[]> {
  const params = new URLSearchParams({
    page: "0",
    pageSize: String(pageSize),
    sortOrder: "DESC",
    sortBy: "lastSeenAt",
  });
  // Momence uses "query" parameter (not "search")
  if (query.trim()) params.append("query", query.trim());

  const url = `${MOMENCE_BASE_URL}/host/members?${params}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      "x-host-id": String(hostId),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Clear cache so next request re-authenticates
      cachedAccessToken = null;
      tokenExpiresAt = 0;
    }
    const body = await res.text();
    throw new Error(`Momence members API failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.payload ?? data.members ?? [];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      action = 'search',
      query = '',
      hostId = 33905,
      pageSize = 20,
      memberId,
    } = body as {
      action?: string;
      query?: string;
      hostId?: number;
      pageSize?: number;
      memberId?: number;
    };

    const accessToken = await authenticate();

    // ── Detail mode: fetch full member info + memberships + session history ─
    if (action === 'detail' && memberId) {
      const [detail, memberships, sessionHistory] = await Promise.all([
        fetchMemberDetail(accessToken, memberId, hostId),
        fetchMemberMemberships(accessToken, memberId, hostId),
        fetchMemberSessionHistory(accessToken, memberId, hostId),
      ]);

      // Normalise active memberships
      const activeMemberships = (memberships as any[]).map((m: any) => ({
        id:                       m.id,
        name:                     m.membership?.name           || null,
        type:                     m.type || m.membership?.type  || null,
        startDate:                m.startDate                   || null,
        endDate:                  m.endDate                     || null,
        isFrozen:                 m.isFrozen                    ?? false,
        usageLimitForSessions:    m.usageLimitForSessions       ?? m.membership?.usageLimitForSessions ?? null,
        usedSessions:             m.usedSessions                ?? null,
        usageLimitForAppointments: m.usageLimitForAppointments  ?? null,
        usedAppointments:         m.usedAppointments            ?? null,
        eventCreditsLeft:         m.eventCreditsLeft            ?? null,
        eventCreditsTotal:        m.eventCreditsTotal           ?? null,
        autoRenewing:             m.membership?.autoRenewing    ?? false,
        description:              m.membership?.description     || null,
      }));

      // Normalise session history
      const sessionBookings = sessionHistory as any[];
      const recentSessionsCount = sessionBookings.length;
      const lastBooking    = sessionBookings[0];
      const lastSessionName = lastBooking?.session?.name     || null;
      const lastSessionDate = lastBooking?.session?.startsAt || null;
      const checkedInCount  = sessionBookings.filter((b: any) => b.checkedIn).length;

      // Customer tags from full detail
      const rawCustomerTags: any[] = (detail as any)?.customerTags ?? (detail as any)?.tags ?? [];
      const customerTags: string[] = rawCustomerTags.map((t: any) =>
        typeof t === 'string' ? t : (t.name ?? t.label ?? '')
      ).filter(Boolean);

      // Customer custom fields
      const customerFields: { label: string; type: string; value: string }[] =
        ((detail as any)?.customerFields ?? []).map((f: any) => ({
          label: f.label || '',
          type:  f.type  || '',
          value: String(f.value ?? ''),
        }));

      const visits = (detail as any)?.visits ?? {};

      return new Response(
        JSON.stringify({
          id:            (detail as any)?.id   || memberId,
          firstName:     (detail as any)?.firstName   || '',
          lastName:      (detail as any)?.lastName    || '',
          email:         (detail as any)?.email       || '',
          phoneNumber:   (detail as any)?.phoneNumber || '',
          pictureUrl:    (detail as any)?.pictureUrl  || null,
          firstSeen:     (detail as any)?.firstSeen   || null,
          lastSeen:      (detail as any)?.lastSeen    || null,
          totalVisits:   visits.total        ?? visits.totalVisits     ?? null,
          totalBookings: visits.bookings     ?? visits.bookingsVisits  ?? null,
          customerTags,
          customerFields,
          activeMemberships,
          recentSessionsCount,
          checkedInCount,
          lastSessionName,
          lastSessionDate,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Search mode (default) ──────────────────────────────────────────────
    const raw = await searchMembers(accessToken, query, hostId, pageSize);

    // Normalise to the slim shape the autocomplete widget expects
    const members = (raw as any[]).map((m: any) => {
      // Tags: Momence may return an array of objects or strings
      const rawTags: any[] = m.tags ?? m.memberTags ?? [];
      const tags: string[] = rawTags.map((t: any) =>
        typeof t === 'string' ? t : (t.name ?? t.label ?? t.tag ?? String(t))
      ).filter(Boolean);

      // Sessions stats — try multiple field name variants the API may use
      const sessionsBooked    = m.totalSessionsBooked    ?? m.bookingCount    ?? m.sessionsBooked    ?? m.totalBookings    ?? null;
      const sessionsCheckedIn = m.totalSessionsCheckedIn ?? m.checkedInCount  ?? m.sessionsCheckedIn ?? m.attendanceCount  ?? null;
      const lateCancelled     = m.totalLateCancellations ?? m.lateCancelledCount ?? m.lateCancellations ?? m.lateCancelCount ?? null;

      // Home location
      const homeLocation =
        m.homeLocation ?? m.homeStudio ?? m.homeLocationName ??
        m.homeStudioName ?? (m.homeStudioId ? String(m.homeStudioId) : null) ?? null;

      return {
        id:                 m.id,
        firstName:          m.firstName   || '',
        lastName:           m.lastName    || '',
        email:              m.email       || '',
        phoneNumber:        m.phoneNumber || '',
        pictureUrl:         m.pictureUrl  || null,
        sessionsBooked,
        sessionsCheckedIn,
        lateCancelled,
        homeLocation,
        tags,
      };
    });

    return new Response(JSON.stringify({ members }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[momence-proxy]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

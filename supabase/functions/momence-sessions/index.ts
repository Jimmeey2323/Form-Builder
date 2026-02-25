import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MOMENCE_BASE = "https://api.momence.com/api/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken;
  }

  const authToken =
    Deno.env.get("MOMENCE_AUTH_TOKEN") ||
    "YXBpLTEzNzUyLW0zOHE2d25nb0VzUGZGM3k6RUNFdGY0S3VtV3hRbjVhbUhSMjV2NHh4OUNrR0UyMWw=";
  const username = Deno.env.get("MOMENCE_USERNAME") || "jimmygonda@gmail.com";
  const password = Deno.env.get("MOMENCE_PASSWORD") || "Jimmeey@123";

  const res = await fetch(`${MOMENCE_BASE}/auth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${authToken}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "password", username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken!;
}

async function fetchSessions(startDate: string, endDate: string): Promise<any> {
  let token = await getAccessToken();

  const params = new URLSearchParams({
    page: "0",
    pageSize: "200",
    sortOrder: "ASC",
    sortBy: "startsAt",
    includeCancelled: "false",
    startAfter: `${startDate}T00:00:00.000Z`,
    endBefore: `${endDate}T23:59:59.999Z`,
  });

  let res = await fetch(`${MOMENCE_BASE}/host/sessions?${params}`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    cachedToken = null;
    token = await getAccessToken();
    res = await fetch(`${MOMENCE_BASE}/host/sessions?${params}`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sessions fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ── Secondary detail call per session ─────────────────────────────────────────
async function fetchSessionDetail(token: string, sessionId: number): Promise<any> {
  try {
    const res = await fetch(`${MOMENCE_BASE}/host/sessions/${sessionId}`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Batch detail fetches with configurable concurrency to avoid rate-limiting
async function fetchAllDetails(
  token: string,
  ids: number[],
  concurrency = 8,
): Promise<Map<number, any>> {
  const map = new Map<number, any>();
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map((id) => fetchSessionDetail(token, id)));
    chunk.forEach((id, idx) => {
      if (results[idx]) map.set(id, results[idx]);
    });
  }
  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let startDate = "";
    let endDate = "";

    const url = new URL(req.url);
    startDate = url.searchParams.get("startDate") || "";
    endDate = url.searchParams.get("endDate") || "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        startDate = body.startDate || startDate;
        endDate = body.endDate || endDate;
      } catch { /* ignore */ }
    }

    if (!startDate || !endDate) {
      const today = new Date();
      const future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      startDate = today.toISOString().split("T")[0];
      endDate = future.toISOString().split("T")[0];
    }

    // 1. Fetch the session list
    const data = await fetchSessions(startDate, endDate);
    const raw: any[] = data.payload ?? data.sessions ?? data ?? [];

    // 2. Fetch per-session detail in parallel batches (uses cached token)
    const token = await getAccessToken();
    const ids = raw.map((s: any) => s.id).filter((id) => id != null) as number[];
    const detailMap = await fetchAllDetails(token, ids, 8);

    // 3. Merge list + detail into a rich session shape
    const sessions = raw.map((s: any) => {
      const detail: any = detailMap.get(s.id) || {};

      const startsAt = s.startsAt || s.startTime || null;
      const endsAt   = s.endsAt   || s.endTime   || null;

      // Duration: prefer detail, then list, then compute from timestamps
      const durationRaw = detail.durationInMinutes ?? s.durationInMinutes ?? s.duration ?? s.durationMinutes ?? null;
      const durationMin = durationRaw != null
        ? durationRaw
        : (startsAt && endsAt
            ? Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
            : null);

      // Instructor / teacher — detail has richer teacher object
      const teacher = detail.teacher || s.teacher || s.instructor || null;
      const instructorName = teacher
        ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()
        : (s.instructorName || s.teacherName || null);

      const originalTeacher = detail.originalTeacher || null;
      const originalTeacherName = originalTeacher
        ? `${originalTeacher.firstName || ""} ${originalTeacher.lastName || ""}`.trim()
        : null;

      const additionalTeachers: string[] = (detail.additionalTeachers || []).map((t: any) =>
        `${t.firstName || ""} ${t.lastName || ""}`.trim()
      ).filter(Boolean);

      // Location — prefer inPersonLocation from detail, else list-derived
      const inPersonLocation = detail.inPersonLocation?.name || null;
      const locationName = inPersonLocation
        || s.location?.name || s.locationName || s.studio?.name || s.room?.name || null;

      // capacity & booking counts — list usually has these, detail may override
      const capacity      = detail.capacity      ?? s.capacity      ?? s.maxCapacity  ?? s.totalSpots ?? null;
      const bookedCount   = detail.bookingCount   ?? s.bookingsCount ?? s.bookedCount  ?? s.currentBookings ?? s.registeredCount ?? null;
      const spotsLeft     = (capacity != null && bookedCount != null)
        ? Math.max(0, capacity - bookedCount)
        : (s.spotsLeft ?? s.availableSpots ?? s.remainingSpots ?? null);
      const waitlistCapacity    = detail.waitlistCapacity    ?? s.waitlistCapacity    ?? null;
      const waitlistBookingCount = detail.waitlistBookingCount ?? s.waitlistBookingCount ?? null;
      const lateCancelled       = s.lateCancellationCount ?? s.lateCancelledCount ?? s.lateCancellations ?? s.lateCancelCount ?? null;

      // Tags from detail
      const tags: string[] = (detail.tags || []).map((t: any) =>
        typeof t === "string" ? t : (t.name || t.label || "")
      ).filter(Boolean);

      return {
        id:            s.id,
        name:          detail.name || s.name || s.title || "Session",
        startsAt,
        endsAt,
        durationMin,
        instructor:    instructorName,
        teacherEmail:  teacher?.email || null,
        teacherPicture: teacher?.pictureUrl || null,
        originalTeacher: originalTeacherName,
        additionalTeachers: additionalTeachers.length ? additionalTeachers.join(", ") : null,
        location:      locationName,
        inPersonLocationName: inPersonLocation,
        capacity,
        spotsLeft,
        bookedCount,
        waitlistCapacity,
        waitlistBookingCount,
        lateCancelled,
        level:         s.level || s.difficultyLevel || s.difficulty || s.levelName || null,
        category:      s.category?.name || s.activityType?.name || s.sessionType?.name || s.sessionType || s.category || null,
        price:         s.price ?? s.cost ?? s.classPrice ?? null,
        description:   detail.description || s.description || null,
        isRecurring:   detail.isRecurring  ?? s.isRecurring  ?? false,
        isInPerson:    detail.isInPerson   ?? s.isInPerson   ?? false,
        isCancelled:   detail.isCancelled  ?? s.isCancelled  ?? false,
        isDraft:       detail.isDraft      ?? s.isDraft      ?? false,
        zoomLink:      detail.zoomLink     || null,
        onlineStreamUrl: detail.onlineStreamUrl || null,
        tags:          tags.length ? tags.join(", ") : null,
      };
    });

    return new Response(JSON.stringify({ sessions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[momence-sessions]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

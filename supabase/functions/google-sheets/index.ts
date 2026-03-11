import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Service Account JWT auth ────────────────────────────────────────────────
async function getServiceAccountToken(): Promise<string> {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY secret is not configured. ' +
      'Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets and add it. ' +
      'See: https://cloud.google.com/iam/docs/creating-managing-service-account-keys'
    );
  }

  let sa: { client_email: string; private_key: string };
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64url = (s: string) =>
    btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const b64urlBytes = (buf: ArrayBuffer) =>
    b64url(String.fromCharCode(...new Uint8Array(buf)));

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify(claim));
  const sigInput = `${header}.${payload}`;

  const pemBody = sa.private_key
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(sigInput),
  );
  const jwt = `${sigInput}.${b64urlBytes(sig)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Google token exchange failed: ' + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

// ── Sheets helpers ──────────────────────────────────────────────────────────
async function createSpreadsheet(
  token: string,
  title: string,
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: 'Form Submissions' } }],
    }),
  });
  const data = await res.json();
  if (!data.spreadsheetId) throw new Error('Failed to create spreadsheet: ' + JSON.stringify(data));

  // Make publicly viewable (ignore errors — Drive API may not be enabled)
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${data.spreadsheetId}/permissions`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    },
  ).catch(() => {/* ignore */});

  return { spreadsheetId: data.spreadsheetId, spreadsheetUrl: data.spreadsheetUrl };
}

async function appendRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[],
) {
  const range = encodeURIComponent(`${sheetName}!A1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    },
  );
  return await res.json();
}

async function getFirstRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
): Promise<string[]> {
  const range = encodeURIComponent(`${sheetName}!A1:ZZ1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  return (data.values && data.values[0]) ? data.values[0] : [];
}

async function updateFirstRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[],
) {
  const range = encodeURIComponent(`${sheetName}!A1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values], range: `${sheetName}!A1` }),
    },
  );
  return await res.json();
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      action,
      formTitle,
      spreadsheetId,
      sheetName: rawSheetName,
      headers: fieldHeaders,
      rowData,
    } = body;

    const sheet = rawSheetName || 'Form Submissions';
    const token = await getServiceAccountToken();

    // ── create ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const result = await createSpreadsheet(token, `FormCraft - ${formTitle || 'Submissions'}`);
      if (fieldHeaders?.length) {
        await appendRow(token, result.spreadsheetId, 'Form Submissions', [
          'Timestamp', ...fieldHeaders, 'UTM Source', 'UTM Medium', 'UTM Campaign',
        ]);
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── append ───────────────────────────────────────────────────────────────
    if (action === 'append') {
      if (!spreadsheetId) throw new Error('spreadsheetId is required');

      // Write header row if sheet is empty
      const existingHeader = await getFirstRow(token, spreadsheetId, sheet);
      if (existingHeader.length === 0 && fieldHeaders?.length) {
        await appendRow(token, spreadsheetId, sheet, [
          'Timestamp', ...fieldHeaders, 'UTM Source', 'UTM Medium', 'UTM Campaign',
        ]);
      }

      // IST timestamp
      const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const iso = istDate.toISOString();
      const [d, t] = iso.split('T');
      const [yr, mo, dy] = d.split('-');
      const timestamp = `${dy}/${mo}/${yr} ${t.substring(0, 8)}`;

      await appendRow(token, spreadsheetId, sheet, [timestamp, ...(rowData ?? [])]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── update-structure ─────────────────────────────────────────────────────
    if (action === 'update-structure') {
      if (!spreadsheetId) throw new Error('spreadsheetId is required');
      if (!fieldHeaders?.length) throw new Error('headers array is required');

      const newHeaders = ['Timestamp', ...fieldHeaders, 'UTM Source', 'UTM Medium', 'UTM Campaign'];
      await updateFirstRow(token, spreadsheetId, sheet, newHeaders);
      return new Response(JSON.stringify({ success: true, updatedHeaders: newHeaders }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

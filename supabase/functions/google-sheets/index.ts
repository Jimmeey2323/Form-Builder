import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('CLIENT_ID')!;
  const clientSecret = Deno.env.get('CLIENT_SECRET')!;
  const refreshToken = Deno.env.get('REFRESH_TOKEN')!;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data));
  return data.access_token;
}

async function createSpreadsheet(accessToken: string, title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{
        properties: { title: 'Form Submissions' },
      }],
    }),
  });
  const data = await res.json();
  if (!data.spreadsheetId) throw new Error('Failed to create spreadsheet: ' + JSON.stringify(data));
  
  // Make it publicly viewable
  const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.spreadsheetId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  await driveRes.text();

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

async function appendRow(accessToken: string, spreadsheetId: string, sheetName: string, values: string[]) {
  const range = `${sheetName}!A1`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [values] }),
    }
  );
  const data = await res.json();
  return data;
}

async function getSheetData(accessToken: string, spreadsheetId: string, sheetName: string) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1:Z1')}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, formTitle, spreadsheetId, sheetName, headers: fieldHeaders, rowData } = await req.json();
    const accessToken = await getAccessToken();

    if (action === 'create') {
      // Create a new spreadsheet for this form
      const result = await createSpreadsheet(accessToken, `FormCraft - ${formTitle || 'Submissions'}`);
      
      // Add header row
      if (fieldHeaders && fieldHeaders.length > 0) {
        await appendRow(accessToken, result.spreadsheetId, 'Form Submissions', [
          'Timestamp', ...fieldHeaders, 'UTM Source', 'UTM Medium', 'UTM Campaign'
        ]);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'append') {
      if (!spreadsheetId) throw new Error('spreadsheetId is required');
      const sheet = sheetName || 'Form Submissions';
      
      // Check if headers exist
      const existing = await getSheetData(accessToken, spreadsheetId, sheet);
      if (!existing.values || existing.values.length === 0) {
        // Add headers first
        if (fieldHeaders && fieldHeaders.length > 0) {
          await appendRow(accessToken, spreadsheetId, sheet, [
            'Timestamp', ...fieldHeaders, 'UTM Source', 'UTM Medium', 'UTM Campaign'
          ]);
        }
      }

      // Format timestamp in IST (UTC+5:30) as DD/MM/YYYY HH:MM:SS
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      const isoStr = istDate.toISOString();
      const [datePart, timePart] = isoStr.split('T');
      const [year, month, day] = datePart.split('-');
      const timeFormatted = timePart.substring(0, 8);
      const timestamp = `${day}/${month}/${year} ${timeFormatted}`;
      await appendRow(accessToken, spreadsheetId, sheet, [timestamp, ...rowData]);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

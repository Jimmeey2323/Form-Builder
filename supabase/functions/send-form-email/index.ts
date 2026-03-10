import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailField {
  label: string;
  name: string;
  value: string;
}

interface SendFormEmailRequest {
  mailtrapToken: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  from: string;
  fromName?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  formTitle: string;
  formId: string;
  fields: EmailField[];
  submittedAt?: string;
}

function buildEmailHtml(
  formTitle: string,
  formId: string,
  fields: EmailField[],
  submittedAt: string,
): string {
  const rows = fields
    .filter((f) => f.value !== undefined && f.value !== null && String(f.value).trim() !== "")
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;width:38%;vertical-align:top;">
          <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${escHtml(f.label)}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
          <span style="font-size:14px;color:#1e293b;word-break:break-word;">${escHtml(String(f.value))}</span>
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Submission — ${escHtml(formTitle)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0;padding:36px 40px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.75);">New Submission</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">${escHtml(formTitle)}</h1>
              <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.65);">
                Received on ${escHtml(submittedAt)} &nbsp;·&nbsp; Form ID: <code style="font-family:monospace;font-size:11px;">${escHtml(formId)}</code>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 8px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;">Submitted Fields</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
                      ${rows || `<tr><td style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No field data submitted.</td></tr>`}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                      This email was sent automatically by your form builder. Do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer spacer -->
          <tr><td style="height:32px;"></td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextBody(formTitle: string, fields: EmailField[], submittedAt: string): string {
  const lines = fields
    .filter((f) => f.value !== undefined && f.value !== null && String(f.value).trim() !== "")
    .map((f) => `${f.label}: ${String(f.value)}`);
  return [
    `New Submission — ${formTitle}`,
    `Received: ${submittedAt}`,
    ``,
    ...lines,
    ``,
    `---`,
    `Sent automatically by your form builder.`,
  ].join("\n");
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Interpolate {{fieldName}} placeholders from submitted data */
function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

function toAddresses(raw: string): Array<{ email: string }> {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: SendFormEmailRequest = await req.json();
    const {
      mailtrapToken,
      from,
      fromName,
      to,
      cc,
      bcc,
      subject,
      formTitle,
      formId,
      fields,
      submittedAt,
    } = body;

    if (!mailtrapToken) {
      return new Response(
        JSON.stringify({ error: "mailtrapToken is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!to || !from) {
      return new Response(
        JSON.stringify({ error: "to and from are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build data map for placeholder interpolation
    const fieldData: Record<string, string> = { formTitle };
    for (const f of fields) {
      fieldData[f.name] = String(f.value ?? "");
    }

    const resolvedTo = interpolate(to, fieldData);
    const resolvedSubject = interpolate(subject, fieldData);
    const ts = submittedAt
      ? new Date(submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });

    const htmlBody = buildEmailHtml(formTitle, formId, fields, ts);
    const textBody = buildTextBody(formTitle, fields, ts);

    const payload: Record<string, unknown> = {
      from: { email: from, name: fromName || formTitle },
      to: toAddresses(resolvedTo),
      subject: resolvedSubject,
      html: htmlBody,
      text: textBody,
    };
    if (cc) payload.cc = toAddresses(cc);
    if (bcc) payload.bcc = toAddresses(bcc);

    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailtrapToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resBody = await res.text();

    if (!res.ok) {
      console.error("Mailtrap error:", res.status, resBody);
      return new Response(
        JSON.stringify({ error: "Mailtrap API error", status: res.status, detail: resBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-form-email error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

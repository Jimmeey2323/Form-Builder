/// <reference path="../types.d.ts" />

type SmtpConn = {
  read(buffer: Uint8Array): Promise<number | null>;
  write(data: Uint8Array): Promise<number>;
  close(): void;
};

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  connectTls(options: { hostname: string; port: number }): Promise<SmtpConn>;
};

// @ts-ignore Deno edge functions support remote URL imports at runtime.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface EmailField {
  label: string;
  name: string;
  value: string;
}

interface SendFormEmailRequest {
  mailtrapToken?: string;
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

function toAddressList(raw?: string): string[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveMailtrapToken(requestToken?: string): string {
  return (
    requestToken?.trim() ||
    Deno.env.get("MAILTRAP_API_TOKEN")?.trim() ||
    Deno.env.get("VITE_MAILTRAP_API_TOKEN")?.trim() ||
    ""
  );
}

function resolveSmtpUsers(): string[] {
  const candidates = [
    Deno.env.get("MAILTRAP_SMTP_USERNAME")?.trim(),
    Deno.env.get("MAILTRAP_SMTP_USER")?.trim(),
    "api",
    "apismtp@mailtrap.io",
  ].filter(Boolean) as string[];

  return [...new Set(candidates)];
}

function toBase64(value: string): string {
  return btoa(value);
}

async function readSmtpResponse(conn: SmtpConn): Promise<string> {
  const chunks: string[] = [];
  const buf = new Uint8Array(1024);

  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    chunks.push(decoder.decode(buf.subarray(0, n)));
    const full = chunks.join("");
    const lines = full.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) continue;
    const last = lines[lines.length - 1];
    if (/^\d{3} /.test(last)) return full;
  }

  return chunks.join("");
}

async function writeSmtpCommand(conn: SmtpConn, command: string, expectedCode: string): Promise<void> {
  await conn.write(encoder.encode(`${command}\r\n`));
  const response = await readSmtpResponse(conn);
  if (!response.startsWith(expectedCode)) {
    throw new Error(`SMTP ${command.split(" ")[0]} failed: ${response}`);
  }
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildMimeMessage(args: {
  from: string;
  fromName: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  textBody: string;
  htmlBody: string;
}): string {
  const boundary = `formcraft-boundary-${crypto.randomUUID()}`;
  const headerLines = [
    `From: ${sanitizeHeaderValue(args.fromName)} <${sanitizeHeaderValue(args.from)}>`,
    `To: ${args.to.map(sanitizeHeaderValue).join(", ")}`,
    ...(args.cc.length ? [`Cc: ${args.cc.map(sanitizeHeaderValue).join(", ")}`] : []),
    `Subject: ${sanitizeHeaderValue(args.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    args.textBody,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    args.htmlBody,
    "",
    `--${boundary}--`,
    "",
  ];

  return headerLines.join("\r\n");
}

async function sendMailtrapEmail(args: {
  from: string;
  fromName: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  textBody: string;
  htmlBody: string;
  mailtrapToken: string;
}): Promise<void> {
  const host = "live.smtp.mailtrap.io";
  const port = 465;
  const smtpUsers = resolveSmtpUsers();
  const rcptTo = [...new Set([...args.to, ...args.cc, ...args.bcc].map((email) => email.trim()).filter(Boolean))];

  if (!rcptTo.length) {
    throw new Error("At least one recipient address is required");
  }

  const message = buildMimeMessage(args);
  let lastError: Error | null = null;

  for (const smtpUser of smtpUsers) {
    let conn: SmtpConn | null = null;
    try {
      conn = await Deno.connectTls({ hostname: host, port });
      const banner = await readSmtpResponse(conn);
      if (!banner.startsWith("220")) {
        throw new Error(`SMTP banner error: ${banner}`);
      }

      await writeSmtpCommand(conn, "EHLO physique57india.com", "250");
      await writeSmtpCommand(conn, "AUTH LOGIN", "334");
      await writeSmtpCommand(conn, toBase64(smtpUser), "334");
      await writeSmtpCommand(conn, toBase64(args.mailtrapToken), "235");
      await writeSmtpCommand(conn, `MAIL FROM:<${args.from}>`, "250");

      for (const recipient of rcptTo) {
        await writeSmtpCommand(conn, `RCPT TO:<${recipient}>`, "250");
      }

      await writeSmtpCommand(conn, "DATA", "354");
      await conn.write(encoder.encode(`${message}\r\n.\r\n`));

      const dataResp = await readSmtpResponse(conn);
      if (!dataResp.startsWith("250")) {
        throw new Error(`SMTP DATA failed: ${dataResp}`);
      }

      await writeSmtpCommand(conn, "QUIT", "221");
      conn.close();
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown SMTP error");
      if (conn) {
        try {
          conn.close();
        } catch {
          // no-op
        }
      }
    }
  }

  throw lastError || new Error("Failed to send Mailtrap email");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: SendFormEmailRequest = await req.json();
    const {
      mailtrapToken: requestedMailtrapToken,
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

    const mailtrapToken = resolveMailtrapToken(requestedMailtrapToken);

    if (!mailtrapToken) {
      return new Response(
        JSON.stringify({ error: "Mailtrap API token is missing. Set MAILTRAP_API_TOKEN in backend credentials/secrets or provide one in the request." }),
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
    const resolvedCc = interpolate(cc ?? "", fieldData);
    const resolvedBcc = interpolate(bcc ?? "", fieldData);
    const resolvedSubject = interpolate(subject, fieldData);
    const ts = submittedAt
      ? new Date(submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });

    const htmlBody = buildEmailHtml(formTitle, formId, fields, ts);
    const textBody = buildTextBody(formTitle, fields, ts);

    await sendMailtrapEmail({
      from,
      fromName: fromName || formTitle,
      to: toAddressList(resolvedTo),
      cc: toAddressList(resolvedCc),
      bcc: toAddressList(resolvedBcc),
      subject: resolvedSubject,
      textBody,
      htmlBody,
      mailtrapToken,
    });

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

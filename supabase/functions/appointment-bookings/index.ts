/// <reference path="../types.d.ts" />

// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface AvailabilityRequest {
  formId: string;
  fieldName: string;
  slotKeys?: string[];
  datePrefix?: string;
}

function isSafeJsonFieldName(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { formId, fieldName, slotKeys = [], datePrefix = "" }: AvailabilityRequest = await req.json();

    if (!formId || !fieldName) {
      return new Response(JSON.stringify({ error: "Missing formId or fieldName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isSafeJsonFieldName(fieldName)) {
      return new Response(JSON.stringify({ error: "Invalid fieldName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const fieldSelector = `data->>${fieldName}`;

    const countsBySlotEntries = await Promise.all(
      slotKeys.map(async (slotKey) => {
        const { count, error } = await supabaseAdmin
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .eq("form_id", formId)
          .filter(fieldSelector, "eq", slotKey);

        if (error) throw error;
        return [slotKey, count ?? 0] as const;
      }),
    );

    let dayBookingCount = 0;
    if (datePrefix) {
      const { count, error } = await supabaseAdmin
        .from("form_submissions")
        .select("id", { count: "exact", head: true })
        .eq("form_id", formId)
        .filter(fieldSelector, "like", `${datePrefix}%`);

      if (error) throw error;
      dayBookingCount = count ?? 0;
    }

    return new Response(
      JSON.stringify({
        countsBySlot: Object.fromEntries(countsBySlotEntries),
        dayBookingCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

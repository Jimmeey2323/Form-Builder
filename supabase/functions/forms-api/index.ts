import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface FormData {
  id: string;
  title: string;
  config: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const url = new URL(req.url)
    const method = req.method

    if (method === 'GET') {
      // Get all forms
      const { data, error } = await supabaseAdmin
        .from('forms')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (method === 'POST') {
      const requestBody = await req.json()
      const { forms }: { forms: FormData[] } = requestBody

      if (!forms || !Array.isArray(forms)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body. Expected { forms: FormData[] }' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Prepare rows for upsert
      const rows = forms.map(f => ({
        id: f.id,
        title: f.title,
        config: f.config,
        updated_at: new Date().toISOString(),
      }))

      // Upsert forms using service role (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('forms')
        .upsert(rows, { onConflict: 'id' })
        .select()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (method === 'DELETE') {
      const url = new URL(req.url)
      const formId = url.searchParams.get('id')

      if (!formId) {
        return new Response(
          JSON.stringify({ error: 'Missing form id parameter' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      const { error } = await supabaseAdmin
        .from('forms')
        .delete()
        .eq('id', formId)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
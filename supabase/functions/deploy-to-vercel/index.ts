import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    if (!vercelToken) throw new Error('VERCEL_TOKEN not configured');

    const { html, formTitle } = await req.json();
    if (!html) throw new Error('html is required');

    const projectName = `formcraft-${(formTitle || 'form').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40)}-${Date.now().toString(36)}`;

    // Create deployment using Vercel API v13
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        files: [
          {
            file: 'index.html',
            data: btoa(unescape(encodeURIComponent(html))),
            encoding: 'base64',
          },
        ],
        projectSettings: {
          framework: null,
        },
        target: 'production',
      }),
    });

    const deployData = await deployRes.json();
    
    if (deployData.error) {
      throw new Error(deployData.error.message || JSON.stringify(deployData.error));
    }

    const url = deployData.url ? `https://${deployData.url}` : null;
    const readyState = deployData.readyState || deployData.status;

    return new Response(JSON.stringify({
      success: true,
      url,
      deploymentId: deployData.id,
      status: readyState,
      projectName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

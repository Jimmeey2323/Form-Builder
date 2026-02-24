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

    const { html, formTitle, formId, vercelProjectDomain, deployedUrl } = await req.json();
    if (!html) throw new Error('html is required');

    // authHeaders must be declared first — used throughout
    const authHeaders = {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    };

    // Resolve which domain to target:
    // 1. Explicit user-supplied domain from settings
    // 2. Previously saved deployed URL (so re-deploys always hit the same project)
    // 3. Auto-derived stable slug from title + formId
    const resolvedDomain = (vercelProjectDomain || deployedUrl || '').trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();

    let projectName: string;
    let knownProductionUrl: string | null = null;

    if (resolvedDomain) {
      if (resolvedDomain.endsWith('.vercel.app')) {
        // e.g. "mysite.vercel.app" → project name is "mysite"
        projectName = resolvedDomain.replace(/\.vercel\.app$/, '');
      } else {
        // Custom domain — look up the owning project via Vercel's Projects API
        const searchRes = await fetch(
          `https://api.vercel.com/v9/projects?search=${encodeURIComponent(resolvedDomain)}&limit=5`,
          { headers: authHeaders }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const matched = (searchData.projects ?? []).find(
            (p: any) => (p.alias ?? []).some((a: any) => (a.domain ?? a) === resolvedDomain)
          );
          projectName = matched?.name ?? resolvedDomain.replace(/\.[^.]+$/, '');
        } else {
          projectName = resolvedDomain.replace(/\.[^.]+$/, '');
        }
      }
      knownProductionUrl = `https://${resolvedDomain}`;
    } else {
      // Auto-derive a stable slug from title + formId
      const titleSlug = (formTitle || 'form')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24); // Reduced from 32 to leave room for ID
      
      // Extract a shorter, more predictable ID from formId
      let idSlug = '';
      if (formId) {
        // If formId contains timestamp, extract last 2-3 digits for brevity
        const idStr = formId.toString();
        const timestampMatch = idStr.match(/(\d{10,})/); // Match 10+ digit timestamps
        if (timestampMatch) {
          // Take last 2-3 digits of timestamp for short, stable ID
          const timestamp = timestampMatch[1];
          idSlug = timestamp.slice(-2); // Just last 2 digits
        } else {
          // Fallback: use last 3 chars of formId, cleaned
          idSlug = idStr.slice(-3).replace(/[^a-z0-9]/g, '');
        }
      }
      
      projectName = `jform-${titleSlug}${idSlug ? `-${idSlug}` : ''}`;
    }

    projectName = projectName.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 52);

    // Step 1: Check if the project already exists and get its real production domain
    let productionAlias = `${projectName}.vercel.app`;
    let projectExists = false;
    try {
      const projectRes = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
        headers: authHeaders,
      });
      if (projectRes.ok) {
        projectExists = true;
        const projectData = await projectRes.json();
        // Prefer a custom domain alias over the default .vercel.app one
        const aliases: string[] = projectData.alias
          ? projectData.alias.map((a: any) => a.domain ?? a)
          : [];
        const customAlias = aliases.find((d: string) => !d.endsWith('.vercel.app'));
        productionAlias = customAlias || `${projectName}.vercel.app`;
      }
      // If 404 → project doesn't exist yet; the deployment will create it
    } catch (_) { /* ignore — fall back to derived URL */ }

    // Step 2: Deploy to the project (creates it if it doesn't exist)
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: authHeaders,
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

    // After deployment, ensure we return the correct public production URL
    // Always prefer the live .vercel.app URL or custom domain over any internal URLs
    let url: string;
    
    try {
      // Re-fetch the project to get the confirmed public aliases after deployment
      const refreshRes = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
        headers: authHeaders,
      });
      
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const aliases: string[] = refreshData.alias
          ? refreshData.alias.map((a: any) => a.domain ?? a)
          : [];
        
        // Priority order: custom domain > project.vercel.app > fallback
        const customAlias = aliases.find((d: string) => !d.endsWith('.vercel.app'));
        const vercelAppAlias = aliases.find((d: string) => d === `${projectName}.vercel.app`);
        
        if (customAlias) {
          url = `https://${customAlias}`;
        } else if (vercelAppAlias) {
          url = `https://${vercelAppAlias}`;
        } else {
          // Fallback to the standard project URL pattern
          url = `https://${projectName}.vercel.app`;
        }
      } else {
        // API call failed, use the standard project URL
        url = `https://${projectName}.vercel.app`;
      }
    } catch (_) {
      // Error during refresh, use the standard project URL
      url = `https://${projectName}.vercel.app`;
    }

    console.log(`Deployment completed. Final URL: ${url}`);

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

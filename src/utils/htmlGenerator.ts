import { FormConfig, FormField } from '@/types/formField';

interface GenerateOptions {
  logoBase64?: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Returns the data-cond-* attribute string for an individual option.
 * Priority: field-level dependentOptionsConfig > per-option conditionalRule.
 */
function getOptionCondData(
  field: FormField,
  optValue: string,
  optConditionalRule?: { fieldId: string; operator: string; value: string },
): string {
  const config = field.dependentOptionsConfig;
  if (config?.sourceFieldId && config.groups.length > 0) {
    const matching = config.groups.filter(g => g.visibleOptionValues.includes(optValue));
    if (matching.length === 1) {
      return ` data-cond-field="${escapeHtml(config.sourceFieldId)}" data-cond-op="equals" data-cond-val="${escapeHtml(matching[0].sourceValue)}"`;
    }
    if (matching.length > 1) {
      const vals = JSON.stringify(matching.map(g => g.sourceValue));
      return ` data-cond-field="${escapeHtml(config.sourceFieldId)}" data-cond-op="in" data-cond-val="${escapeHtml(vals)}"`;
    }
    // option not assigned to any group → always visible
    return '';
  }
  if (optConditionalRule?.fieldId) {
    return ` data-cond-field="${escapeHtml(optConditionalRule.fieldId)}" data-cond-op="${optConditionalRule.operator}" data-cond-val="${escapeHtml(optConditionalRule.value)}"`;
  }
  return '';
}

function generateFieldHtml(field: FormField, allFields: FormField[]): string {
  if (field.type === 'page-break') {
    return `
    <div class="page-break" data-page-break="true">
      <div class="page-break-label">${escapeHtml(field.label || 'Next Page')}</div>
    </div>`;
  }

  if (field.type === 'section-break') {
    return `
    <div class="section-break">
      <h3>${escapeHtml(field.label)}</h3>
      ${field.helpText ? `<p class="help-text">${escapeHtml(field.helpText)}</p>` : ''}
    </div>`;
  }

  const required = field.isRequired ? ' required' : '';
  const requiredMark = field.isRequired ? '<span class="required">*</span>' : '';
  const hidden = field.isHidden ? ' style="display:none"' : '';
  const readonly = field.isReadOnly ? ' readonly' : '';
  const disabled = field.isDisabled ? ' disabled' : '';
  const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : '';
  const helpText = field.helpText ? `\n      <span class="help-text">${escapeHtml(field.helpText)}</span>` : '';
  const cssClass = field.cssClass ? ` ${field.cssClass}` : '';
  const widthStyle = field.width && field.width !== '100' ? ` style="grid-column: span ${Math.round(parseInt(field.width) / (100/12))} / span ${Math.round(parseInt(field.width) / (100/12))}"` : '';
  const autocomplete = field.autocomplete ? ` autocomplete="${escapeHtml(field.autocomplete)}"` : '';
  const minLen = field.minLength ? ` minlength="${field.minLength}"` : '';
  const maxLen = field.maxLength ? ` maxlength="${field.maxLength}"` : '';
  const minVal = field.min !== undefined ? ` min="${field.min}"` : '';
  const maxVal = field.max !== undefined ? ` max="${field.max}"` : '';
  const stepVal = field.step ? ` step="${field.step}"` : '';
  const pattern = field.pattern ? ` pattern="${escapeHtml(field.pattern)}"` : '';
  const accept = field.accept ? ` accept="${escapeHtml(field.accept)}"` : '';
  const defaultVal = field.defaultValue ? ` value="${escapeHtml(field.defaultValue)}"` : '';

  let condAttrs = '';
  if (field.conditionalRules && field.conditionalRules.length > 0) {
    condAttrs = ` data-conditions='${JSON.stringify(field.conditionalRules)}'`;
  }
  if (field.dependsOnFieldId) {
    condAttrs += ` data-depends-on="${escapeHtml(field.dependsOnFieldId)}"`;
  }

  let inputHtml = '';

  switch (field.type) {
    case 'textarea':
      inputHtml = `<textarea id="${field.id}" name="${field.name}"${required}${readonly}${disabled}${placeholder}${minLen}${maxLen}${condAttrs} class="form-input${cssClass}" rows="4">${field.defaultValue || ''}</textarea>`;
      break;
    case 'select':
      inputHtml = `<select id="${field.id}" name="${field.name}"${required}${disabled}${condAttrs}${autocomplete} class="form-input${cssClass}">
        <option value="" disabled selected>${field.placeholder || 'Select an option'}</option>
        ${(field.options || []).map(o => {
          const condData = getOptionCondData(field, o.value, o.conditionalRule);
          return `<option value="${escapeHtml(o.value)}"${condData}>${escapeHtml(o.label)}</option>`;
        }).join('\n        ')}
      </select>`;
      break;
    case 'radio':
      inputHtml = `<div class="radio-group${cssClass}"${condAttrs}>
        ${(field.options || []).map(o => {
          const condData = getOptionCondData(field, o.value, o.conditionalRule);
          return `<label class="radio-option"${condData}><input type="radio" name="${field.name}" value="${escapeHtml(o.value)}"${required}${disabled}> ${escapeHtml(o.label)}</label>`;
        }).join('\n        ')}
      </div>`;
      break;
    case 'checkbox':
      inputHtml = `<div class="checkbox-group${cssClass}"${condAttrs}>
        ${(field.options || []).map(o => {
          const condData = getOptionCondData(field, o.value, o.conditionalRule);
          return `<label class="checkbox-option"${condData}><input type="checkbox" name="${field.name}" value="${escapeHtml(o.value)}"${disabled}> ${escapeHtml(o.label)}</label>`;
        }).join('\n        ')}
      </div>`;
      break;
    case 'hidden':
      return `    <input type="hidden" id="${field.id}" name="${field.name}"${defaultVal}${condAttrs}>`;
    case 'rating':
      const max = field.max || 5;
      inputHtml = `<div class="rating-group${cssClass}"${condAttrs}>
        ${Array.from({ length: max }, (_, i) => `<label class="rating-star"><input type="radio" name="${field.name}" value="${i + 1}"${required}> ★</label>`).join('\n        ')}
      </div>`;
      break;
    case 'lookup':
      inputHtml = `<select id="${field.id}" name="${field.name}"${required}${disabled}${condAttrs} class="form-input${cssClass}" data-lookup="true">
        <option value="" disabled selected>Select...</option>
        ${field.lookupConfig ? Object.entries(field.lookupConfig.lookupData).map(([k, v]) => `<option value="${escapeHtml(k)}">${escapeHtml(v)}</option>`).join('\n        ') : ''}
      </select>`;
      break;
    case 'formula':
      inputHtml = `<input type="text" id="${field.id}" name="${field.name}" readonly class="form-input formula-field${cssClass}"${condAttrs} data-formula="${escapeHtml(field.formulaConfig?.expression || '')}"${defaultVal}>`;
      break;
    case 'conditional':
    case 'dependent':
      inputHtml = `<input type="text" id="${field.id}" name="${field.name}"${required}${readonly}${disabled}${placeholder}${condAttrs}${defaultVal} class="form-input${cssClass}">`;
      break;
    case 'signature':
      inputHtml = `<div class="signature-pad${cssClass}"${condAttrs}>
        <canvas id="sig_${field.id}" width="400" height="200" style="touch-action:none;"></canvas>
        <input type="hidden" id="${field.id}" name="${field.name}"${required}>
        <div class="sig-controls">
          <button type="button" class="clear-sig" onclick="clearSignature('${field.id}')">Clear</button>
          <button type="button" class="undo-sig" onclick="undoSignature('${field.id}')">Undo</button>
        </div>
        <p class="help-text" style="margin-top:4px;">Draw your signature above</p>
      </div>`;
      break;
    case 'tel':
      inputHtml = `<div class="phone-input-group${cssClass}"${condAttrs}>
        <select id="${field.id}_code" class="form-input country-code-select" onchange="updatePhoneValue('${field.id}')">
          <option value="+91" selected>🇮🇳 +91</option>
          <option value="+1">🇺🇸 +1</option>
          <option value="+44">🇬🇧 +44</option>
          <option value="+971">🇦🇪 +971</option>
          <option value="+65">🇸🇬 +65</option>
          <option value="+63">🇵🇭 +63</option>
          <option value="+33">🇫🇷 +33</option>
          <option value="+49">🇩🇪 +49</option>
          <option value="+81">🇯🇵 +81</option>
          <option value="+86">🇨🇳 +86</option>
          <option value="+61">🇦🇺 +61</option>
          <option value="+34">🇪🇸 +34</option>
        </select>
        <input type="tel" id="${field.id}_number" name="${field.name}_raw"${required}${readonly}${disabled} placeholder="${escapeHtml(field.placeholder || 'Phone number')}"${minLen}${maxLen}${pattern}${autocomplete} class="form-input phone-number-input" oninput="updatePhoneValue('${field.id}')">
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    default:
      inputHtml = `<input type="${field.type}" id="${field.id}" name="${field.name}"${required}${readonly}${disabled}${placeholder}${defaultVal}${minLen}${maxLen}${minVal}${maxVal}${stepVal}${pattern}${accept}${autocomplete}${condAttrs} class="form-input${cssClass}">`;
  }

  return `
    <div class="form-group"${hidden}${widthStyle}>
      <label for="${field.id}">${escapeHtml(field.label)}${requiredMark}</label>
      ${inputHtml}${helpText}
    </div>`;
}

function generatePixelScripts(config: FormConfig): string {
  const { pixelConfig } = config;
  let scripts = '';

  if (pixelConfig.snapPixelId) {
    scripts += `
    <!-- Snap Pixel Code -->
    <script type='text/javascript'>
    (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
    {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
    a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
    r.src=n;var u=t.getElementsByTagName(s)[0];
    u.parentNode.insertBefore(r,u);})(window,document,
    'https://sc-static.net/scevent.min.js');
    snaptr('init', '${escapeHtml(pixelConfig.snapPixelId)}', {});
    snaptr('track', 'PAGE_VIEW');
    </script>`;
  }

  if (pixelConfig.metaPixelId) {
    scripts += `
    <!-- Meta Pixel -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${escapeHtml(pixelConfig.metaPixelId)}');
    fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escapeHtml(pixelConfig.metaPixelId)}&ev=PageView&noscript=1"/></noscript>`;
  }

  if (pixelConfig.googleAdsId) {
    scripts += `
    <!-- Google Ads -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(pixelConfig.googleAdsId)}"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${escapeHtml(pixelConfig.googleAdsId)}');
    </script>`;
  }

  if (pixelConfig.customScripts) {
    scripts += `\n    ${pixelConfig.customScripts}`;
  }

  return scripts;
}

function generateWebhookScript(config: FormConfig): string {
  const { webhookConfig, pixelConfig } = config;
  
  let utmScript = '';
  if (webhookConfig.includeUtmParams) {
    const utmDefaults = webhookConfig.utmParamDefaults || {};
    const defaultsJson = JSON.stringify({
      utm_source: utmDefaults.utm_source || '',
      utm_medium: utmDefaults.utm_medium || '',
      utm_campaign: utmDefaults.utm_campaign || '',
      utm_term: utmDefaults.utm_term || '',
      utm_content: utmDefaults.utm_content || '',
    });
    utmScript = `
        // UTM Parameter extraction
        function getUtmParameters() {
            var defaults = ${defaultsJson};
            var searchString = window.location.search;
            if (!searchString && window.location.href.includes('?')) {
                var urlParts = window.location.href.split('?');
                if (urlParts.length > 1) searchString = '?' + urlParts[1];
            }
            var params = new URLSearchParams(searchString);
            return {
                utm_source: params.get('utm_source') || defaults.utm_source || '',
                utm_medium: params.get('utm_medium') || defaults.utm_medium || '',
                utm_campaign: params.get('utm_campaign') || defaults.utm_campaign || '',
                utm_content: params.get('utm_content') || defaults.utm_content || '',
                utm_term: params.get('utm_term') || defaults.utm_term || '',
                utm_id: params.get('utm_id') || '',
                gclid: params.get('gclid') || '',
                fbclid: params.get('fbclid') || ''
            };
        }
        var utmParams = getUtmParameters();`;
  }

  let pixelEvents = '';
  if (pixelConfig.snapPixelId) {
    pixelEvents += `
                if (typeof snaptr !== 'undefined') {
                    snaptr('track', 'SIGN_UP', {
                        'sign_up_method': 'form_submission',
                        'user_email': formData.get('email') || '',
                        'firstname': formData.get('firstName') || '',
                        'lastname': formData.get('lastName') || '',
                        'phone_number': formData.get('phoneNumber') || '',
                        'zip_code': formData.get('zipCode') || ''
                    });
                }`;
  }
  if (pixelConfig.metaPixelId) {
    pixelEvents += `
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', baseData);
                }`;
  }

  const headersStr = Object.entries(webhookConfig.headers)
    .map(([k, v]) => `'${escapeHtml(k)}': '${escapeHtml(v)}'`)
    .join(',\n                    ');

  let dataBuilder = 'var data = baseData;';
  if (webhookConfig.token || webhookConfig.sourceId || webhookConfig.includeUtmParams) {
    dataBuilder = `var data = Object.assign({}, baseData`;
    if (webhookConfig.token) dataBuilder += `, { token: '${escapeHtml(webhookConfig.token)}' }`;
    if (webhookConfig.sourceId) dataBuilder += `, { sourceId: '${escapeHtml(webhookConfig.sourceId)}' }`;
    if (webhookConfig.includeUtmParams) dataBuilder += `, utmParams`;
    dataBuilder += `);`;
  }

  const redirectLine = webhookConfig.redirectUrl 
    ? `launchConfetti(); setTimeout(function(){ window.top.location.href = '${escapeHtml(webhookConfig.redirectUrl)}'; }, 1400);`
    : `launchConfetti(); document.getElementById('generated-form').innerHTML = '<div class="success-message"><h2>✓</h2><p>${escapeHtml(config.successMessage).replace(/'/g, "\\'")}</p></div>';`;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const supabaseSaveScript = `
                // Record submission in Supabase
                try {
                  fetch('${supabaseUrl}/rest/v1/form_submissions', {
                    method: 'POST',
                    headers: {
                      'apikey': '${supabaseAnonKey}',
                      'Authorization': 'Bearer ${supabaseAnonKey}',
                      'Content-Type': 'application/json',
                      'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                      form_id: '${escapeHtml(config.id)}',
                      form_title: '${escapeHtml(config.title)}',
                      data: data,
                      utm_params: typeof utmParams !== 'undefined' ? utmParams : null,
                      submitted_at: new Date().toISOString()
                    })
                  }).catch(function(e) { console.warn('Supabase log error:', e); });
                } catch(e) {}`;

  if (!webhookConfig.enabled) {
    return `
        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var submitBtn = this.querySelector('.submit-btn');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }
            var formData = new FormData(this);
            formData.delete('phoneNumber_raw');
            var baseData = Object.fromEntries(formData);
            var data = baseData;
            console.log('Form submitted:', baseData);${pixelEvents}
            ${generateSheetsSubmitScript(config)}
            ${supabaseSaveScript}
            ${redirectLine}
        });`;
  }

  return `${utmScript}

        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            var formData = new FormData(this);
            // Remove raw phone input, keep the combined one
            formData.delete('phoneNumber_raw');
            var baseData = Object.fromEntries(formData);
            ${dataBuilder}

            console.log('Submitting data:', JSON.stringify(data));

            fetch('${escapeHtml(webhookConfig.url)}', {
                method: '${webhookConfig.method}',
                headers: {
                    ${headersStr}
                },
                body: JSON.stringify(data)
            }).then(function(response) {
                if (!response.ok) {
                    return response.text().then(function(body) {
                        console.error('API Response (' + response.status + '):', body);
                        throw new Error('Submission failed (' + response.status + '): ' + body);
                    });
                }
                return response;
            }).then(function() {${pixelEvents}
                ${generateSheetsSubmitScript(config)}
                ${supabaseSaveScript}
                ${redirectLine}
            }).catch(function(error) {
                console.error('Error:', error);
                alert(error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = '${escapeHtml(config.submitButtonText)}';
            });
        });`;
}

function generateSheetsSubmitScript(config: FormConfig): string {
  const { googleSheetsConfig } = config;
  if (!googleSheetsConfig.enabled || !googleSheetsConfig.spreadsheetId) return '';
  
  const supabaseUrl = 'https://pwgdytetevxwuujdevis.supabase.co';
  const fieldNames = config.fields
    .filter(f => f.type !== 'page-break' && f.type !== 'section-break')
    .sort((a, b) => a.order - b.order)
    .map(f => f.name);
  
  return `
                // Send to Google Sheets
                var sheetRowData = [${fieldNames.map(n => `(baseData['${n}'] || '')`).join(', ')}];
                if (typeof utmParams !== 'undefined') {
                    sheetRowData.push(utmParams.utm_source || '', utmParams.utm_medium || '', utmParams.utm_campaign || '');
                }
                fetch('${supabaseUrl}/functions/v1/google-sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'append',
                        spreadsheetId: '${escapeHtml(googleSheetsConfig.spreadsheetId)}',
                        sheetName: '${escapeHtml(googleSheetsConfig.sheetName || 'Form Submissions')}',
                        rowData: sheetRowData
                    })
                }).catch(function(e) { console.error('Sheets error:', e); });`;
}

function getSelectAddresses(config: FormConfig): Record<string, string> {
  const addresses: Record<string, string> = {};
  // Collect option.address mappings from every select/radio/checkbox field
  config.fields.forEach(f => {
    if (f.options) {
      f.options.forEach(o => {
        if (o.address && o.value) {
          addresses[o.value] = o.address;
        }
      });
    }
  });
  return addresses;
}

function getLayoutGridCss(layout: string, fieldGap = '16px'): string {
  switch (layout) {
    case 'two-column':
      return `
        .form-fields-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${fieldGap};
        }
        .form-fields-grid .section-break,
        .form-fields-grid .form-group[style*="grid-column"] { }
        @media (max-width: 640px) {
            .form-fields-grid { grid-template-columns: 1fr; }
        }`;
    case 'three-column':
      return `
        .form-fields-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: ${fieldGap};
        }
        @media (max-width: 768px) {
            .form-fields-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
            .form-fields-grid { grid-template-columns: 1fr; }
        }`;
    case 'custom':
      return `
        .form-fields-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: ${fieldGap};
        }
        .form-fields-grid > .form-group:not([style*="grid-column"]) {
            grid-column: span 12 / span 12;
        }
        .form-fields-grid > .section-break {
            grid-column: 1 / -1;
        }
        @media (max-width: 640px) {
            .form-fields-grid { grid-template-columns: 1fr; }
            .form-fields-grid > .form-group { grid-column: span 1 !important; }
        }`;
    default: // single
      return `
        .form-fields-grid {
            display: flex;
            flex-direction: column;
            gap: ${fieldGap};
        }`;
  }
}

function generateLayoutCss(config: FormConfig): string {
  const layout = config.layout ?? 'classic';
  if (layout === 'classic') return '';

  const imgFit = config.layoutImageFit || 'cover';

  // Map named fit options to CSS background-size + background-repeat
  const FIT_MAP: Record<string, { size: string; repeat: string }> = {
    'cover':    { size: 'cover',      repeat: 'no-repeat' },
    'contain':  { size: 'contain',    repeat: 'no-repeat' },
    'fill':     { size: '100% 100%',  repeat: 'no-repeat' },
    'natural':  { size: 'auto',       repeat: 'no-repeat' },
    'zoom-in':  { size: '130%',       repeat: 'no-repeat' },
    'zoom-out': { size: '70%',        repeat: 'no-repeat' },
    'tile':     { size: 'auto',       repeat: 'repeat'    },
  };
  const { size: bgSize, repeat: bgRepeat } = FIT_MAP[imgFit] ?? FIT_MAP['cover'];
  const imgSrc = config.layoutImageUrl ? `url('${config.layoutImageUrl}')` : 'none';
  const posX = config.layoutImagePositionX ?? '50';
  const posY = config.layoutImagePositionY ?? '50';
  const imgPanelW = config.layoutImagePanelWidth ?? 45;
  const formPanelW = 100 - imgPanelW;

  const base = `
        /* ── Layout: ${layout} ── */
        body.layout-card .form-container {
            box-shadow: 0 32px 64px -12px rgba(0,0,0,0.28), 0 16px 32px -8px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04);
        }
        body.layout-split-left, body.layout-split-right {
            padding: 0;
            align-items: stretch;
            justify-content: flex-start;
            min-height: 100vh;
        }
        body.layout-split-left { flex-direction: row; }
        body.layout-split-right { flex-direction: row-reverse; }
        .layout-image-panel {
            flex: 0 0 ${imgPanelW}%;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            background-color: #6366f1;
            background-image: ${imgSrc};
            background-size: ${bgSize};
            background-position: ${posX}% ${posY}%;
            background-repeat: ${bgRepeat};
        }
        .layout-image-overlay {
            display: none;
        }
        .layout-form-panel {
            flex: 0 0 ${formPanelW}%;
            min-width: 0;
            min-height: 100vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            padding: 56px 64px;
            background: var(--bg-primary);
            box-sizing: border-box;
        }
        /* Strip card styling in split layout — panel IS the container */
        body.layout-split-left .form-container,
        body.layout-split-right .form-container {
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border-radius: 0;
            background: transparent;
            animation: none;
            flex-shrink: 0;
        }
        body.layout-split-left .form-container::before,
        body.layout-split-right .form-container::before {
            display: none;
        }
        /* Remove inner horizontal padding — outer panel padding is enough */
        body.layout-split-left .logo-container,
        body.layout-split-right .logo-container,
        body.layout-split-left .form-header,
        body.layout-split-right .form-header,
        body.layout-split-left .form-body,
        body.layout-split-right .form-body {
            padding-left: 0;
            padding-right: 0;
        }
        body.layout-banner-top {
            flex-direction: column;
            align-items: center;
            padding: 0;
            background: var(--bg-primary);
        }
        .layout-banner {
            width: 100%;
            height: 260px;
            flex-shrink: 0;
            background-color: #6366f1;
            background-image: ${imgSrc !== 'none' ? imgSrc : 'var(--primary-gradient)'};
            background-size: ${bgSize};
            background-position: ${posX}% ${posY}%;
            background-repeat: ${bgRepeat};
            position: relative;
        }
        body.layout-banner-top .form-container {
            margin-top: -48px;
            margin-bottom: 32px;
            position: relative;
            z-index: 1;
        }
        body.layout-floating {
            position: relative;
        }
        .layout-backdrop {
            position: fixed;
            inset: 0;
            z-index: 0;
            background-color: rgba(0,0,0,0.45);
            background-image: ${imgSrc};
            background-size: ${bgSize};
            background-position: ${posX}% ${posY}%;
            background-repeat: ${bgRepeat};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        body.layout-floating .form-container {
            position: relative;
            z-index: 1;
        }
        body.layout-fullscreen {
            padding: 0;
            align-items: stretch;
            background: var(--bg-primary);
        }
        body.layout-fullscreen .form-container {
            border-radius: 0;
            box-shadow: none;
            width: 100%;
            max-width: 100%;
            animation: none;
        }
        @media (max-width: 768px) {
            body.layout-split-left, body.layout-split-right {
                flex-direction: column;
            }
            .layout-image-panel { min-height: 260px; flex: none; width: 100%; }
            .layout-form-panel { width: 100%; padding: 40px 28px; }
        }`;
  return base;
}

function generateAnimationCss(config: FormConfig): string {
  const anim = config.animations;
  if (!anim?.enabled) return '';

  const dur = `${anim.duration ?? 500}ms`;

  const easingMap: Record<string, string> = {
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'cubic-bezier(0.0, 0, 0.2, 1)',
    'ease-in-out': 'ease-in-out',
    'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };
  const easing = easingMap[anim.easing || 'spring'] || 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  const keyframes = `
        @keyframes _fadeIn       { from { opacity:0 } to { opacity:1 } }
        @keyframes _slideDown    { from { opacity:0; transform:translateY(-22px) } to { opacity:1; transform:translateY(0) } }
        @keyframes _slideUp      { from { opacity:0; transform:translateY(22px)  } to { opacity:1; transform:translateY(0) } }
        @keyframes _zoomIn       { from { opacity:0; transform:scale(0.80) }      to { opacity:1; transform:scale(1) } }
        @keyframes _spinIn       { from { opacity:0; transform:rotate(-180deg) scale(0.5) } to { opacity:1; transform:rotate(0deg) scale(1) } }
        @keyframes _bounceIn     { 0%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1.08)} 80%{transform:scale(0.95)} 100%{transform:scale(1)} }
        @keyframes _floatIn      { 0%{opacity:0;transform:translateY(18px) scale(0.95)} 60%{transform:translateY(-6px) scale(1.02)} 100%{opacity:1;transform:none} }
        @keyframes _glowPulse    { 0%{opacity:0;filter:brightness(3) blur(6px)} 60%{filter:brightness(1.4) blur(1px)} 100%{opacity:1;filter:none} }
        @keyframes _revealClip   { from{opacity:0;clip-path:inset(0 100% 0 0)} to{opacity:1;clip-path:inset(0 0% 0 0)} }
        @keyframes _splitReveal  { from{opacity:0;letter-spacing:0.4em;transform:scaleX(1.25)} to{opacity:1;letter-spacing:normal;transform:scaleX(1)} }
        @keyframes _glitchIn     { 0%{opacity:0;transform:skew(6deg)} 20%{opacity:1;transform:skew(-4deg) translateX(4px)} 40%{transform:skew(2deg) translateX(-2px)} 70%{transform:skew(-1deg)} 100%{opacity:1;transform:none} }
        @keyframes _perspectiveFlip { from{opacity:0;transform:perspective(500px) rotateX(90deg)} to{opacity:1;transform:perspective(500px) rotateX(0)} }
        @keyframes _expandIn     { from{opacity:0;transform:scaleX(0.15)} to{opacity:1;transform:scaleX(1)} }
        @keyframes _blurIn       { from{opacity:0;filter:blur(18px)} to{opacity:1;filter:blur(0)} }
        @keyframes _cascadeIn    { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:none} }
        @keyframes _flipIn       { from{opacity:0;transform:perspective(400px) rotateY(90deg)} to{opacity:1;transform:perspective(400px) rotateY(0)} }
        @keyframes _springIn     { 0%{opacity:0;transform:scale(0.4)} 55%{transform:scale(1.12)} 75%{transform:scale(0.94)} 100%{opacity:1;transform:scale(1)} }`;

  const animDecl = (name: string) => `animation: ${name} ${dur} ${easing} both;`;

  const logoCss = anim.logo && anim.logo !== 'none' ? `.logo-container img { ${animDecl(`_${anim.logo}`)} }` : '';
  const titleCss = anim.title && anim.title !== 'none'
    ? `.form-header h1, .form-sub-header, .form-header p { ${animDecl(anim.title === 'typewriter' ? '_fadeIn' : `_${anim.title}`)} }`
    : '';
  const headerCss = anim.header && anim.header !== 'none' ? `.form-event-meta { ${animDecl(`_${anim.header}`)} }` : '';
  const footerCss = anim.footer && anim.footer !== 'none' ? `.form-footer { ${animDecl(`_${anim.footer}`)} }` : '';

  // For fields, CSS gives the base "invisible" state; JS will add the class + delay
  const fieldBaseCss = anim.fields && anim.fields !== 'none' ? `
        .form-group, .section-break { opacity: 0; }
        .form-group.animated, .section-break.animated { ${animDecl(anim.fields === 'stagger' ? '_slideUp' : `_${anim.fields}`)} opacity: 1; }` : '';

  return `${keyframes}
        ${logoCss}
        ${titleCss}
        ${headerCss}
        ${footerCss}
        ${fieldBaseCss}`;
}

function generateAnimationScript(config: FormConfig): string {
  const anim = config.animations;
  if (!anim?.enabled || !anim.fields || anim.fields === 'none') return '';

  const staggerDelay = anim.staggerDelay ?? 80;

  return `
        // Field entrance animations
        (function() {
            var els = document.querySelectorAll('.form-group, .section-break');
            var delay = 0;
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var el = entry.target;
                        setTimeout(function() { el.classList.add('animated'); }, parseInt(el.dataset.animDelay) || 0);
                        observer.unobserve(el);
                    }
                });
            }, { threshold: 0.1 });
            els.forEach(function(el) {
                el.dataset.animDelay = delay;
                delay += ${staggerDelay};
                observer.observe(el);
            });
        })();`;
}

export function generateFormHtml(config: FormConfig, options?: GenerateOptions): string {
  const { theme, pixelConfig } = config;
  const sortedFields = [...config.fields].sort((a, b) => a.order - b.order);
  
  const pages: FormField[][] = [[]];
  sortedFields.forEach(f => {
    if (f.type === 'page-break') {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(f);
    }
  });

  const isMultiPage = pages.length > 1;
  const layout = theme.formLayout || 'single';

  const shadowMap: Record<string, string> = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
  };

  const formShadow = shadowMap[theme.formShadow] || shadowMap.xl;

  const paginationStyles = isMultiPage ? `
        .form-page { display: none; }
        .form-page.active { display: block; }
        .page-nav { display: flex; gap: 12px; margin-top: 20px; }
        .page-nav button { flex: 1; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .page-nav button:hover { border-color: var(--primary-color); color: var(--primary-color); }
        .page-nav .btn-next { background: var(--primary-gradient); color: white; border: none; }
        .page-nav .btn-next:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .page-indicator { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; }
        .page-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border-color); transition: all 0.3s; }
        .page-dot.active { background: var(--primary-color); transform: scale(1.2); }
  ` : '';

  const wrapFields = (fields: FormField[]) => 
    `<div class="form-fields-grid">\n${fields.map(f => generateFieldHtml(f, sortedFields)).join('\n')}\n              </div>`;

  const pagesHtml = isMultiPage
    ? pages.map((pageFields, pi) => `
              <div class="form-page${pi === 0 ? ' active' : ''}" data-page="${pi}">
                ${wrapFields(pageFields)}
                ${pi < pages.length - 1 ? `
                <div class="page-nav">
                  ${pi > 0 ? `<button type="button" class="btn-prev" onclick="goToPage(${pi - 1})">← Back</button>` : ''}
                  <button type="button" class="btn-next" onclick="goToPage(${pi + 1})">Next →</button>
                </div>` : `
                <div class="page-nav">
                  ${pi > 0 ? `<button type="button" class="btn-prev" onclick="goToPage(${pi - 1})">← Back</button>` : ''}
                  <button type="submit" class="submit-btn">${escapeHtml(config.submitButtonText)}</button>
                </div>`}
              </div>`).join('\n')
    : `
                ${wrapFields(sortedFields)}
                <div style="margin-top: 20px;">
                    <button type="submit" class="submit-btn">${escapeHtml(config.submitButtonText)}</button>
                </div>`;

  const pageIndicatorHtml = isMultiPage 
    ? `<div class="page-indicator">${pages.map((_, i) => `<div class="page-dot${i === 0 ? ' active' : ''}" data-dot="${i}"></div>`).join('')}</div>`
    : '';

  const multiPageScript = isMultiPage ? `
        function goToPage(n) {
            var allPages = document.querySelectorAll('.form-page');
            var dots = document.querySelectorAll('.page-dot');
            allPages.forEach(function(p) { p.classList.remove('active'); });
            dots.forEach(function(d) { d.classList.remove('active'); });
            allPages[n].classList.add('active');
            dots[n].classList.add('active');
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }` : '';

  const logoSrc = options?.logoBase64 || (theme.logoUrl ? escapeHtml(theme.logoUrl) : '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(config.title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    ${generatePixelScripts(config)}
    <style>
        :root {
            --primary-color: ${theme.primaryColor};
            --secondary-color: ${theme.secondaryColor};
            --primary-gradient: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%);
            --text-primary: ${theme.textColor};
            --text-secondary: #64748b;
            --text-light: #94a3b8;
            --bg-primary: ${theme.formBackgroundColor};
            --bg-secondary: #f8fafc;
            --border-color: ${theme.inputBorderColor};
            --border-focus: ${theme.primaryColor};
            --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
            --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
            --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
            --radius: ${theme.borderRadius};
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: ${theme.fontFamily};
            background: ${(theme.backgroundColor || '#f1f5f9').includes('gradient') ? theme.backgroundColor : `linear-gradient(135deg, ${theme.backgroundColor || '#f1f5f9'} 0%, #e2e8f0 100%)`};
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            color: var(--text-primary);
        }
        .form-container {
            background: var(--bg-primary);
            border-radius: var(--radius);
            box-shadow: ${formShadow};
            width: ${theme.formWidth};
            max-width: ${theme.formMaxWidth};
            position: relative;
            overflow: hidden;
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .form-container::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: var(--primary-gradient);
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .logo-container {
            text-align: ${theme.headerAlign || 'center'};
            padding: ${theme.logoTopPadding || '16px'} ${theme.logoSidePadding || theme.formPadding} 0;
            margin: 0;
            background: var(--bg-secondary);
        }
        .logo-container img {
            max-width: ${theme.logoMaxWidth || '72px'};
            height: auto;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.05));
        }
        .form-header {
            padding: ${theme.showLogo ? '10px' : '24px'} ${theme.logoSidePadding || theme.formPadding} 16px;
            text-align: ${theme.headerAlign || 'center'};
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
        }
        .form-header h1 {
            font-size: ${theme.headerFontSize || '22px'};
            font-weight: ${theme.headerFontWeight || '700'};
            font-style: ${theme.headerFontStyle || 'normal'};
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        .form-header p {
            font-size: 14px;
            color: var(--text-secondary);
        }
        .form-sub-header {
            font-size: 14px;
            font-weight: 500;
            color: var(--primary-color);
            margin-top: 4px;
            letter-spacing: 0.02em;
        }
        .form-event-meta {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 10px;
            padding: 8px 16px;
            background: linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor}10);
            border-radius: 8px;
            border: 1px solid ${theme.primaryColor}25;
        }
        .form-event-meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
        }
        .form-event-meta-item svg { flex-shrink: 0; opacity: 0.7; }
        .form-footer {
            text-align: ${theme.headerAlign || 'center'};
            font-size: 11px;
            color: var(--text-light);
            padding: 12px ${theme.formPadding} 16px;
            border-top: 1px solid var(--border-color);
            margin-top: 4px;
            line-height: ${theme.lineHeight || '1.6'};
        }
        .form-body { padding: 24px ${theme.formPadding} ${theme.formPadding}; }
        .form-group {
            line-height: ${theme.lineHeight || '1.6'};
        }
        .form-group label {
            display: block;
            font-size: ${theme.labelFontSize};
            font-weight: 500;
            color: ${theme.labelColor};
            text-align: ${theme.labelAlign || 'left'};
            margin-bottom: 6px;
        }
        .required { color: #ef4444; margin-left: 2px; }
        .form-input {
            width: 100%;
            padding: ${theme.inputPadding};
            border: 2px solid var(--border-color);
            border-radius: 8px;
            font-family: inherit;
            font-size: ${theme.inputFontSize};
            background: ${theme.inputBackgroundColor};
            color: var(--text-primary);
            transition: all 0.2s ease;
        }
        .form-input:focus {
            outline: none;
            border-color: var(--border-focus);
            box-shadow: 0 0 0 3px ${theme.primaryColor}1a;
            transform: translateY(-1px);
        }
        .form-input::placeholder { color: var(--text-light); }
        select.form-input {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 12px center;
            background-repeat: no-repeat;
            background-size: 16px;
            padding-right: 40px;
        }
        textarea.form-input { resize: vertical; min-height: 100px; }
        .help-text { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
        .radio-group, .checkbox-group { display: flex; flex-direction: column; gap: 8px; }
        .radio-option, .checkbox-option {
            display: flex; align-items: center; gap: 8px;
            font-size: 14px; cursor: pointer; padding: 10px 14px;
            border: 2px solid var(--border-color); border-radius: 8px;
            transition: all 0.15s ease;
        }
        .radio-option:hover, .checkbox-option:hover { border-color: var(--border-focus); background: var(--bg-secondary); }
        .rating-group { display: flex; gap: 4px; font-size: 28px; }
        .rating-star { cursor: pointer; color: var(--border-color); transition: color 0.15s; }
        .rating-star:hover, .rating-star:has(input:checked) { color: #f59e0b; }
        .rating-star input { display: none; }
        .section-break {
            margin: 8px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--border-color);
            grid-column: 1 / -1;
        }
        .section-break h3 { font-size: 16px; font-weight: 600; }
        .formula-field { background: var(--bg-secondary); font-family: monospace; }

        /* Phone input with country code */
        .phone-input-group {
            display: flex;
            gap: 8px;
        }
        .country-code-select {
            width: 110px !important;
            flex-shrink: 0;
            font-size: 14px !important;
            padding-right: 28px !important;
        }
        .phone-number-input {
            flex: 1;
        }

        /* Advanced Signature */
        .signature-pad {
            border: 2px solid var(--border-color);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            background: var(--bg-secondary);
        }
        .signature-pad canvas {
            border: 1px dashed var(--border-color);
            border-radius: 4px;
            max-width: 100%;
            background: #fff;
            cursor: crosshair;
        }
        .sig-controls {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-top: 8px;
        }
        .clear-sig, .undo-sig {
            padding: 6px 16px;
            background: none;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.15s;
        }
        .clear-sig:hover, .undo-sig:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
        }

        /* Pincode validation */
        .pincode-error {
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
            display: none;
        }

        .submit-btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: var(--primary-gradient);
            color: ${theme.buttonTextColor};
            font-family: inherit;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
        }
        .submit-btn::before {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:active { transform: translateY(-1px); }
        .submit-btn:disabled {
            background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
            cursor: not-allowed; transform: none; box-shadow: var(--shadow-sm);
        }
        .success-message { text-align: center; padding: 40px 20px; }
        .success-message h2 { font-size: 48px; margin-bottom: 12px; }
        .success-message p { font-size: 16px; color: var(--text-secondary); }
        ${getLayoutGridCss(layout, theme.fieldGap || '16px')}
        ${paginationStyles}
        @media (max-width: 640px) {
            .form-body { padding: 20px 20px 24px; }
            .form-header { padding: 24px 20px 8px; }
            .phone-input-group { flex-direction: column; }
            .country-code-select { width: 100% !important; }
        }
        ${theme.customCss || ''}
        ${generateAnimationCss(config)}
        ${generateLayoutCss(config)}
    </style>
    <script>
    // ── Confetti ──────────────────────────────────────────────────────────────
    function launchConfetti() {
      var canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
      document.body.appendChild(canvas);
      var W = canvas.width  = window.innerWidth;
      var H = canvas.height = window.innerHeight;
      var ctx = canvas.getContext('2d');
      var COLORS = ['#6366f1','#818cf8','#a5b4fc','#22d3ee','#fbbf24','#f87171','#4ade80','#fb923c','#e879f9','#38bdf8'];
      var TOTAL = 180;
      var pieces = [];
      // two bursts from left-center and right-center
      var origins = [{x: W * 0.25, y: H * 0.4}, {x: W * 0.75, y: H * 0.4}, {x: W * 0.5, y: H * 0.35}];
      for (var i = 0; i < TOTAL; i++) {
        var o = origins[i % origins.length];
        var angle = (Math.random() * 2 - 1) * Math.PI * 0.65 - Math.PI / 2;
        var speed = Math.random() * 14 + 6;
        pieces.push({
          x: o.x + (Math.random() - 0.5) * 20,
          y: o.y,
          vx: Math.cos(angle) * speed * (Math.random() * 0.5 + 0.75),
          vy: Math.sin(angle) * speed * (Math.random() * 0.5 + 0.75),
          w: Math.random() * 11 + 4,
          h: Math.random() * 5 + 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSp: (Math.random() - 0.5) * 0.22,
          shape: Math.random() < 0.35 ? 'circle' : 'rect',
          opacity: 1
        });
      }
      var start = null;
      var DURATION = 3800;
      function frame(ts) {
        if (!start) start = ts;
        var t = ts - start;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < pieces.length; i++) {
          var p = pieces[i];
          p.vy += 0.38;
          p.vx *= 0.992;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSp;
          if (t > DURATION * 0.55) {
            p.opacity = Math.max(0, 1 - (t - DURATION * 0.55) / (DURATION * 0.45));
          }
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
          ctx.restore();
        }
        if (t < DURATION) { requestAnimationFrame(frame); }
        else { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
      }
      requestAnimationFrame(frame);
    }
    </script>
</head>
<body${config.layout && config.layout !== 'classic' ? ` class="layout-${config.layout}"` : ''}>
    ${['split-left','split-right'].includes(config.layout ?? '') ? `<div class="layout-image-panel"><div class="layout-image-overlay"></div></div>` : ''}
    ${config.layout === 'banner-top' ? `<div class="layout-banner"></div>` : ''}
    ${config.layout === 'floating' ? `<div class="layout-backdrop"></div>` : ''}
    ${['split-left','split-right'].includes(config.layout ?? '') ? '<div class="layout-form-panel">' : ''}
    <div class="form-container">
        ${theme.showLogo && logoSrc ? `<div class="logo-container"><img src="${logoSrc}" alt="Logo"></div>` : ''}
        <div class="form-header">
            <h1>${escapeHtml(config.title)}</h1>
            ${config.subHeader ? `<p class="form-sub-header">${escapeHtml(config.subHeader)}</p>` : ''}
            ${config.description ? `<p>${escapeHtml(config.description)}</p>` : ''}
            ${(config.venue || config.dateTimeStamp) ? `
            <div class="form-event-meta">
              ${config.venue ? `<span class="form-event-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(config.venue)}</span>` : ''}
              ${config.dateTimeStamp ? `<span class="form-event-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(config.dateTimeStamp)}</span>` : ''}
            </div>` : ''}
        </div>
        <div class="form-body">
            ${pageIndicatorHtml}
            <form id="generated-form">
${pagesHtml}
            </form>
            <div id="address-display" style="display:none; align-items:center; gap:8px; margin-top:16px; padding:14px 16px; background:var(--bg-secondary); border-radius:8px; border:1px solid var(--border-color);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span id="location-address" style="font-size:13px; color:var(--text-secondary);"></span>
            </div>
        </div>
        ${config.footer ? `<div class="form-footer">${escapeHtml(config.footer)}</div>` : ''}
    </div>
    ${['split-left','split-right'].includes(config.layout ?? '') ? '</div>' : ''}
    <script>
        ${multiPageScript}
        ${generateWebhookScript(config)}

        // Phone country code handler
        function updatePhoneValue(fieldId) {
            var codeSelect = document.getElementById(fieldId + '_code');
            var numberInput = document.getElementById(fieldId + '_number');
            var hiddenInput = document.getElementById(fieldId);
            if (codeSelect && numberInput && hiddenInput) {
                var num = numberInput.value.replace(/\\D/g, '');
                hiddenInput.value = num ? codeSelect.value + num : '';
            }
        }

        // Indian pincode validation
        (function() {
            var pincodeField = document.getElementById('zipCode');
            if (pincodeField) {
                var errorEl = document.createElement('span');
                errorEl.className = 'pincode-error';
                errorEl.textContent = 'Please enter a valid 6-digit Indian pincode';
                pincodeField.parentNode.appendChild(errorEl);
                pincodeField.addEventListener('blur', function() {
                    var val = this.value.trim();
                    var isValid = /^[1-9][0-9]{5}$/.test(val);
                    errorEl.style.display = val && !isValid ? 'block' : 'none';
                    if (val && !isValid) {
                        this.setCustomValidity('Please enter a valid 6-digit Indian pincode');
                    } else {
                        this.setCustomValidity('');
                    }
                });
            }
        })();

        // Address display for center/location select
        (function() {
            var centerSelect = document.getElementById('center');
            var addressDisplay = document.getElementById('address-display');
            var locationAddress = document.getElementById('location-address');
            var addresses = ${JSON.stringify(getSelectAddresses(config))};
            if (centerSelect && addressDisplay && locationAddress) {
                centerSelect.addEventListener('change', function() {
                    var addr = addresses[this.value];
                    if (addr) {
                        locationAddress.textContent = addr;
                        addressDisplay.style.display = 'flex';
                    } else {
                        addressDisplay.style.display = 'none';
                    }
                });
            }
        })();

        ${pixelConfig.snapPixelId ? `
        // Fire VIEW_CONTENT on page load
        if (typeof snaptr !== 'undefined') {
            snaptr('track', 'VIEW_CONTENT');
        }` : ''}

        // Conditional OPTION visibility (data-cond-field / data-cond-op / data-cond-val)
        (function() {
            function evalCondition(fieldId, op, val) {
                var el = document.querySelector('[id="' + fieldId + '"], [name="' + fieldId + '"]');
                if (!el) return true;
                var current = el.value || '';
                switch (op) {
                    case 'equals':     return current === val;
                    case 'not_equals': return current !== val;
                    case 'contains':   return current.indexOf(val) !== -1;
                    case 'in':         try { return JSON.parse(val).indexOf(current) !== -1; } catch(e) { return false; }
                    default:           return true;
                }
            }

            function refreshConditionalOptions() {
                // options inside <select>
                document.querySelectorAll('select option[data-cond-field]').forEach(function(opt) {
                    var ok = evalCondition(opt.dataset.condField, opt.dataset.condOp, opt.dataset.condVal);
                    opt.hidden = !ok;
                    opt.disabled = !ok;
                    if (!ok && opt.selected) opt.selected = false;
                });
                // labels inside radio/checkbox groups
                document.querySelectorAll('.radio-group label[data-cond-field], .checkbox-group label[data-cond-field]').forEach(function(lbl) {
                    var ok = evalCondition(lbl.dataset.condField, lbl.dataset.condOp, lbl.dataset.condVal);
                    lbl.style.display = ok ? '' : 'none';
                    var inp = lbl.querySelector('input');
                    if (inp) { inp.disabled = !ok; if (!ok) inp.checked = false; }
                });
            }

            // Run once on load
            refreshConditionalOptions();
            // Re-run whenever any form input changes
            document.getElementById('generated-form').addEventListener('input', refreshConditionalOptions);
            document.getElementById('generated-form').addEventListener('change', refreshConditionalOptions);
        })();

        // Conditional field logic
        document.querySelectorAll('[data-conditions]').forEach(function(el) {
            try {
                var conditions = JSON.parse(el.getAttribute('data-conditions'));
                conditions.forEach(function(rule) {
                    var src = document.querySelector('[name="' + rule.dependsOnFieldId + '"]');
                    if (src) {
                        src.addEventListener('change', function() {
                            var val = this.value;
                            var match = false;
                            switch(rule.operator) {
                                case 'equals': match = val === rule.value; break;
                                case 'not_equals': match = val !== rule.value; break;
                                case 'contains': match = val.includes(rule.value); break;
                                case 'is_empty': match = !val; break;
                                case 'is_not_empty': match = !!val; break;
                            }
                            var group = el.closest('.form-group');
                            if (group) {
                                if (rule.action === 'show') group.style.display = match ? '' : 'none';
                                if (rule.action === 'hide') group.style.display = match ? 'none' : '';
                            }
                        });
                    }
                });
            } catch(e) {}
        });

        // Advanced signature pad
        (function() {
            document.querySelectorAll('.signature-pad canvas').forEach(function(canvas) {
                var ctx = canvas.getContext('2d');
                var drawing = false;
                var paths = [];
                var currentPath = [];
                var fieldId = canvas.id.replace('sig_', '');
                var hiddenInput = document.getElementById(fieldId);

                function getPos(e) {
                    var rect = canvas.getBoundingClientRect();
                    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    return {
                        x: (clientX - rect.left) * (canvas.width / rect.width),
                        y: (clientY - rect.top) * (canvas.height / rect.height)
                    };
                }

                function startDraw(e) {
                    e.preventDefault();
                    drawing = true;
                    currentPath = [];
                    var pos = getPos(e);
                    currentPath.push(pos);
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                }

                function draw(e) {
                    if (!drawing) return;
                    e.preventDefault();
                    var pos = getPos(e);
                    currentPath.push(pos);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }

                function endDraw() {
                    if (!drawing) return;
                    drawing = false;
                    if (currentPath.length > 0) {
                        paths.push([...currentPath]);
                    }
                    if (hiddenInput) hiddenInput.value = canvas.toDataURL();
                }

                canvas.addEventListener('mousedown', startDraw);
                canvas.addEventListener('mousemove', draw);
                canvas.addEventListener('mouseup', endDraw);
                canvas.addEventListener('mouseleave', endDraw);
                canvas.addEventListener('touchstart', startDraw);
                canvas.addEventListener('touchmove', draw);
                canvas.addEventListener('touchend', endDraw);

                window['clearSignature'] = function(fid) {
                    var c = document.getElementById('sig_' + fid);
                    if (c) {
                        c.getContext('2d').clearRect(0, 0, c.width, c.height);
                        paths = [];
                        var h = document.getElementById(fid);
                        if (h) h.value = '';
                    }
                };

                window['undoSignature'] = function(fid) {
                    var c = document.getElementById('sig_' + fid);
                    if (c && paths.length > 0) {
                        paths.pop();
                        var cx = c.getContext('2d');
                        cx.clearRect(0, 0, c.width, c.height);
                        paths.forEach(function(path) {
                            cx.beginPath();
                            cx.moveTo(path[0].x, path[0].y);
                            path.forEach(function(p) { cx.lineTo(p.x, p.y); });
                            cx.strokeStyle = '#1e293b';
                            cx.lineWidth = 2;
                            cx.lineCap = 'round';
                            cx.lineJoin = 'round';
                            cx.stroke();
                        });
                        var h = document.getElementById(fid);
                        if (h) h.value = paths.length > 0 ? c.toDataURL() : '';
                    }
                };
            });
        })();
        ${generateAnimationScript(config)}
    </script>
</body>
</html>`;
}

// Utility to convert image URL to base64 data URI
export async function convertImageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url; // fallback to original URL
  }
}

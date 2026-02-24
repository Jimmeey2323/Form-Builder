import { FormConfig, FormField } from '@/types/formField';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const widthClass = field.width && field.width !== '100' ? ` field-w-${field.width}` : '';
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
        ${(field.options || []).map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('\n        ')}
      </select>`;
      break;
    case 'radio':
      inputHtml = `<div class="radio-group${cssClass}"${condAttrs}>
        ${(field.options || []).map(o => `<label class="radio-option"><input type="radio" name="${field.name}" value="${escapeHtml(o.value)}"${required}${disabled}> ${escapeHtml(o.label)}</label>`).join('\n        ')}
      </div>`;
      break;
    case 'checkbox':
      inputHtml = `<div class="checkbox-group${cssClass}"${condAttrs}>
        ${(field.options || []).map(o => `<label class="checkbox-option"><input type="checkbox" name="${field.name}" value="${escapeHtml(o.value)}"${disabled}> ${escapeHtml(o.label)}</label>`).join('\n        ')}
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
        <canvas id="sig_${field.id}" width="400" height="150"></canvas>
        <input type="hidden" id="${field.id}" name="${field.name}"${required}>
        <button type="button" class="clear-sig" onclick="document.getElementById('sig_${field.id}').getContext('2d').clearRect(0,0,400,150)">Clear</button>
      </div>`;
      break;
    default:
      inputHtml = `<input type="${field.type}" id="${field.id}" name="${field.name}"${required}${readonly}${disabled}${placeholder}${defaultVal}${minLen}${maxLen}${minVal}${maxVal}${stepVal}${pattern}${accept}${autocomplete}${condAttrs} class="form-input${cssClass}">`;
  }

  return `
    <div class="form-group${widthClass}"${hidden}>
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
    utmScript = `
        // UTM Parameter extraction
        function getUtmParameters() {
            var searchString = window.location.search;
            if (!searchString && window.location.href.includes('?')) {
                var urlParts = window.location.href.split('?');
                if (urlParts.length > 1) searchString = '?' + urlParts[1];
            }
            var params = new URLSearchParams(searchString);
            return {
                utm_source: params.get('utm_source') || '',
                utm_medium: params.get('utm_medium') || '',
                utm_campaign: params.get('utm_campaign') || '',
                utm_content: params.get('utm_content') || '',
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
                        'user_email': formData.get('email') || ''
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
    ? `window.top.location.href = '${escapeHtml(webhookConfig.redirectUrl)}';`
    : `document.getElementById('generated-form').innerHTML = '<div class="success-message"><h2>✓</h2><p>${escapeHtml(config.successMessage).replace(/'/g, "\\'")}</p></div>';`;

  if (!webhookConfig.enabled) {
    return `
        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var baseData = Object.fromEntries(formData);
            console.log('Form submitted:', baseData);${pixelEvents}
            this.innerHTML = '<div class="success-message"><h2>✓</h2><p>${escapeHtml(config.successMessage).replace(/'/g, "\\'")}</p></div>';
        });`;
  }

  return `${utmScript}

        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            var formData = new FormData(this);
            var baseData = Object.fromEntries(formData);
            ${dataBuilder}

            fetch('${escapeHtml(webhookConfig.url)}', {
                method: '${webhookConfig.method}',
                headers: {
                    ${headersStr}
                },
                body: JSON.stringify(data)
            }).then(function(response) {
                if (!response.ok) throw new Error('Failed: ' + response.statusText);${pixelEvents}
                ${redirectLine}
            }).catch(function(error) {
                console.error('Error:', error);
                alert(error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = '${escapeHtml(config.submitButtonText)}';
            });
        });`;
}

export function generateFormHtml(config: FormConfig): string {
  const { theme } = config;
  const sortedFields = [...config.fields].sort((a, b) => a.order - b.order);
  
  // Split fields into pages
  const pages: FormField[][] = [[]];
  sortedFields.forEach(f => {
    if (f.type === 'page-break') {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(f);
    }
  });

  const isMultiPage = pages.length > 1;

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

  const pagesHtml = isMultiPage
    ? pages.map((pageFields, pi) => `
              <div class="form-page${pi === 0 ? ' active' : ''}" data-page="${pi}">
${pageFields.map(f => generateFieldHtml(f, sortedFields)).join('\n')}
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
${sortedFields.map(f => generateFieldHtml(f, sortedFields)).join('\n')}
                <div style="margin-top: 16px;">
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
            background: ${theme.backgroundColor.includes('gradient') ? theme.backgroundColor : `linear-gradient(135deg, ${theme.backgroundColor} 0%, #e2e8f0 100%)`};
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
            text-align: center;
            padding: 28px 32px 12px;
            background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        }
        .logo-container img {
            max-width: 72px;
            height: auto;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.05));
        }
        .form-header {
            padding: ${theme.showLogo ? '8px' : '32px'} ${theme.formPadding} 8px;
            text-align: center;
        }
        .form-header h1 {
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        .form-header p {
            font-size: 14px;
            color: var(--text-secondary);
        }
        .form-body { padding: 24px ${theme.formPadding} ${theme.formPadding}; }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: ${theme.labelFontSize};
            font-weight: 500;
            color: ${theme.labelColor};
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
            margin: 24px 0 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--border-color);
        }
        .section-break h3 { font-size: 16px; font-weight: 600; }
        .formula-field { background: var(--bg-secondary); font-family: monospace; }
        .signature-pad { border: 2px solid var(--border-color); border-radius: 8px; padding: 8px; text-align: center; }
        .signature-pad canvas { border: 1px dashed var(--border-color); border-radius: 4px; max-width: 100%; }
        .clear-sig {
            margin-top: 8px; padding: 6px 16px;
            background: none; border: 1px solid var(--border-color);
            border-radius: 6px; cursor: pointer; font-size: 12px;
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
        .field-w-25 { display: inline-block; width: 25%; vertical-align: top; padding-right: 8px; }
        .field-w-33 { display: inline-block; width: 33.33%; vertical-align: top; padding-right: 8px; }
        .field-w-50 { display: inline-block; width: 50%; vertical-align: top; padding-right: 8px; }
        .field-w-66 { display: inline-block; width: 66.66%; vertical-align: top; padding-right: 8px; }
        .field-w-75 { display: inline-block; width: 75%; vertical-align: top; padding-right: 8px; }
        ${paginationStyles}
        @media (max-width: 640px) {
            .form-body { padding: 20px 20px 24px; }
            .form-header { padding: 24px 20px 8px; }
            .field-w-25, .field-w-33, .field-w-50, .field-w-66, .field-w-75 { width: 100%; display: block; padding-right: 0; }
        }
        ${theme.customCss || ''}
    </style>
</head>
<body>
    <div class="form-container">
        ${theme.showLogo && theme.logoUrl ? `<div class="logo-container"><img src="${escapeHtml(theme.logoUrl)}" alt="Logo"></div>` : ''}
        <div class="form-header">
            <h1>${escapeHtml(config.title)}</h1>
            ${config.description ? `<p>${escapeHtml(config.description)}</p>` : ''}
        </div>
        <div class="form-body">
            ${pageIndicatorHtml}
            <form id="generated-form">
${pagesHtml}
            </form>
        </div>
    </div>
    <script>
        ${multiPageScript}
        ${generateWebhookScript(config)}

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

        // Phone formatter
        var phoneInput = document.querySelector('input[type="tel"]');
        if (phoneInput) {
            phoneInput.addEventListener('blur', function() {
                var num = this.value.replace(/\\D/g, '');
                if (num.length === 10) this.value = '+91' + num;
                else if (num.length > 10) this.value = '+' + num;
            });
        }
    </script>
</body>
</html>`;
}

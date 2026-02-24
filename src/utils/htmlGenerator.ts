import { FormConfig, FormField } from '@/types/formField';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateFieldHtml(field: FormField, allFields: FormField[]): string {
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

  // Conditional attributes
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

export function generateFormHtml(config: FormConfig): string {
  const { theme } = config;
  const sortedFields = [...config.fields].sort((a, b) => a.order - b.order);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(config.title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${theme.primaryColor};
            --secondary-color: ${theme.secondaryColor};
            --primary-gradient: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%);
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-light: #94a3b8;
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --border-color: #e2e8f0;
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
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
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
            box-shadow: var(--shadow-xl);
            width: 100%;
            max-width: 520px;
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
        .form-header {
            padding: 32px 32px 8px;
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
        .form-body { padding: 24px 32px 32px; }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 6px;
        }
        .required { color: #ef4444; margin-left: 2px; }
        .form-input {
            width: 100%;
            padding: 12px 14px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            font-family: inherit;
            font-size: 15px;
            background: var(--bg-primary);
            color: var(--text-primary);
            transition: all 0.2s ease;
        }
        .form-input:focus {
            outline: none;
            border-color: var(--border-focus);
            box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
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
            font-size: 14px; cursor: pointer; padding: 8px 12px;
            border: 1px solid var(--border-color); border-radius: 8px;
            transition: all 0.15s ease;
        }
        .radio-option:hover, .checkbox-option:hover { border-color: var(--border-focus); background: var(--bg-secondary); }
        .rating-group { display: flex; gap: 4px; font-size: 24px; }
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
            margin-top: 8px; padding: 4px 12px;
            background: none; border: 1px solid var(--border-color);
            border-radius: 4px; cursor: pointer; font-size: 12px;
        }
        .submit-btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: var(--primary-gradient);
            color: white;
            font-family: inherit;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-md);
            margin-top: 8px;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .submit-btn:active { transform: translateY(-1px); }
        .field-w-25 { display: inline-block; width: 25%; vertical-align: top; padding-right: 8px; }
        .field-w-33 { display: inline-block; width: 33.33%; vertical-align: top; padding-right: 8px; }
        .field-w-50 { display: inline-block; width: 50%; vertical-align: top; padding-right: 8px; }
        .field-w-66 { display: inline-block; width: 66.66%; vertical-align: top; padding-right: 8px; }
        .field-w-75 { display: inline-block; width: 75%; vertical-align: top; padding-right: 8px; }
        @media (max-width: 640px) {
            .form-body { padding: 20px 20px 24px; }
            .form-header { padding: 24px 20px 8px; }
            .field-w-25, .field-w-33, .field-w-50, .field-w-66, .field-w-75 { width: 100%; display: block; padding-right: 0; }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="form-header">
            <h1>${escapeHtml(config.title)}</h1>
            ${config.description ? `<p>${escapeHtml(config.description)}</p>` : ''}
        </div>
        <div class="form-body">
            <form id="generated-form">
${sortedFields.map(f => generateFieldHtml(f, sortedFields)).join('\n')}
                <div style="margin-top: 12px;">
                    <button type="submit" class="submit-btn">${escapeHtml(config.submitButtonText)}</button>
                </div>
            </form>
        </div>
    </div>
    <script>
        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(this));
            console.log('Form submitted:', data);
            alert('${escapeHtml(config.successMessage).replace(/'/g, "\\'")}');
        });

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
    </script>
</body>
</html>`;
}

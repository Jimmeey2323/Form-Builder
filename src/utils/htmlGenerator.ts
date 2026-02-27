import { FormConfig, FormField } from '@/types/formField';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface GenerateOptions {
  logoBase64?: string;
}

function generateFormTitle(config: FormConfig): string {
  const title = config.title;
  const theme = config.theme;
  
  // If cursive header is not enabled, return plain title
  if (!theme.headerCursiveEnabled) {
    return escapeHtml(title);
  }
  
  const cursiveFont = theme.headerCursiveFont || 'Great Vibes';
  const cursivePart = theme.headerCursivePart || 'all';
  
  if (cursivePart === 'all') {
    return `<span style="font-family: ${cursiveFont}, cursive; font-size: 1.2em;">${escapeHtml(title)}</span>`;
  }
  
  // Split the title in half
  const midpoint = Math.ceil(title.length / 2);
  const firstHalf = title.substring(0, midpoint);
  const secondHalf = title.substring(midpoint);
  
  if (cursivePart === 'left') {
    return `<span style="font-family: ${cursiveFont}, cursive; font-size: 1.2em;">${escapeHtml(firstHalf)}</span><span>${escapeHtml(secondHalf)}</span>`;
  } else {
    return `<span>${escapeHtml(firstHalf)}</span><span style="font-family: ${cursiveFont}, cursive; font-size: 1.2em;">${escapeHtml(secondHalf)}</span>`;
  }
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
    case 'member-search': {
      const mCfg    = field.momenceSearchConfig;
      const searchPh = escapeHtml(mCfg?.searchPlaceholder || 'Type a name, email or phone…');
      const hostId   = mCfg?.hostId ?? 33905;
      const locField = escapeHtml(mCfg?.locationFieldName || '');
      const pfx      = escapeHtml(field.name);
      const reqMark  = field.isRequired ? '<span class="required">*</span>' : '';
      const mf = (lbl: string, nm: string, type = 'text', span2 = false) =>
        `<div class="form-group mmember-field-group"${span2 ? ' style="grid-column:span 2"' : ''}>
              <label class="mmember-field-label">${lbl}</label>
              <input type="${type}" name="${pfx}_${nm}" readonly class="form-input mmember-field" placeholder="Auto-filled">
            </div>`;
      return `
    <div class="form-group"${hidden}${widthStyle}>
      <div class="mmember-section${cssClass}"${condAttrs}
        data-momence-search="true"
        data-host-id="${hostId}"
        data-location-field="${locField}"
        data-field-prefix="${pfx}">
        <div class="mmember-section-header">
          <div class="mmember-header-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span class="mmember-section-title">${escapeHtml(field.label)}${reqMark}</span>
          </div>
          <button type="button" class="msr-card-clear" style="display:none;">✕ Clear</button>
        </div>
        <div class="mmember-search-row">
          <div class="member-search-input-row">
            <svg class="member-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" id="${field.id}_search" autocomplete="off" spellcheck="false"
                   placeholder="${searchPh}" class="form-input member-search-input">
            <button type="button" class="member-search-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="msr-btn-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span class="msr-btn-text">Search</span>
              <span class="member-search-spinner" style="display:none;">
                <svg class="msr-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              </span>
            </button>
          </div>
          <div class="member-search-dropdown" style="display:none;"></div>
        </div>
        <div class="msr-member-card" style="display:none;">
          <div class="msr-card-top">
            <div class="msr-card-photo-wrap"></div>
            <div class="msr-card-identity">
              <div class="msr-card-name"></div>
              <div class="msr-card-contact"></div>
            </div>
          </div>
          <div class="msr-card-stats-row"></div>
          <div class="msr-card-tags-row"></div>
        </div>
        <input type="hidden" id="${field.id}" name="${escapeHtml(field.name)}">
        <div class="mmember-detail-fields" style="display:none;">
          <div class="mmember-detail-divider">
            <span>Member Details</span>
            <span class="mmember-detail-loading" style="display:none;">⟳ Fetching details…</span>
          </div>
          <div class="mmember-fields-grid">
            ${mf('First Name', 'first_name')}
            ${mf('Last Name', 'last_name')}
            ${mf('Email', 'email', 'email', true)}
            ${mf('Phone', 'phone', 'tel')}
            ${mf('Home Location', 'home_location')}
            ${mf('Sessions Booked', 'sessions_booked')}
            ${mf('Sessions Checked-In', 'sessions_checked_in')}
            ${mf('Late Cancellations', 'late_cancelled')}
            ${mf('Tags', 'tags', 'text', true)}
            ${mf('Customer Tags', 'customer_tags', 'text', true)}
            ${mf('First Seen', 'first_seen')}
            ${mf('Last Seen', 'last_seen')}
            ${mf('Total Visits', 'total_visits')}
            ${mf('Active Membership', 'active_membership', 'text', true)}
            ${mf('Membership Type', 'membership_type')}
            ${mf('Membership End Date', 'membership_end_date')}
            ${mf('Sessions Used', 'membership_sessions_used')}
            ${mf('Sessions Limit', 'membership_sessions_limit')}
            ${mf('Membership Frozen', 'membership_frozen')}
            ${mf('Recent Sessions', 'recent_sessions_count')}
            ${mf('Last Session', 'last_session_name', 'text', true)}
            ${mf('Last Session Date', 'last_session_date', 'text', true)}
          </div>
        </div>
      </div>
    </div>`;
    }
    case 'momence-sessions': {
      const sCfg = field.momenceSessionsConfig;
      const rangeDays      = sCfg?.dateRangeDays ?? 30;
      const allowMultiple  = sCfg?.allowMultiple !== false;
      const showDatePicker = sCfg?.showDatePicker !== false;
      const pfxS = escapeHtml(field.name);
      const reqMarkS = field.isRequired ? '<span class="required">*</span>' : '';
      const sf = (lbl: string, nm: string, type = 'text', span2 = false) =>
        `<div class="form-group msess-field-group"${span2 ? ' style="grid-column:span 2"' : ''}>
              <label class="msess-field-label">${lbl}</label>
              <input type="${type}" name="${pfxS}_${nm}" readonly class="form-input msess-field" placeholder="Auto-filled">
            </div>`;
      return `
    <div class="form-group"${hidden}${widthStyle}>
      <div class="msess-section${cssClass}"${condAttrs}
        data-momence-sessions="true"
        data-range-days="${rangeDays}"
        data-allow-multiple="${allowMultiple}"
        data-field-prefix="${pfxS}">
        <div class="msess-section-header" style="cursor:pointer;justify-content:space-between" onclick="var b=this.nextElementSibling;var c=this.querySelector('.msess-hdr-chevron');var open=b.style.display!=='none';b.style.display=open?'none':'block';c.style.transform=open?'':'rotate(180deg)'">
          <div style="display:flex;align-items:center;gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span class="msess-section-title">${escapeHtml(field.label)}${reqMarkS}</span>
          </div>
          <svg class="msess-hdr-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="msess-section-body" style="display:none">
        ${showDatePicker ? `<div class="msess-controls">
          <input type="date" class="form-input msess-start" title="From">
          <span class="msess-sep">to</span>
          <input type="date" class="form-input msess-end" title="To">
          <button type="button" class="msess-load-btn">
            <svg class="msess-load-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span class="msess-btn-text">Load Sessions</span>
          </button>
        </div>` : ''}
        <div class="msess-list"><div class="msess-placeholder">Click <em>Load Sessions</em> to fetch available sessions.</div></div>
        <input type="hidden" id="${field.id}" name="${escapeHtml(field.name)}">
        <div class="msess-detail-fields">
          <div class="msess-detail-divider" style="cursor:pointer" onclick="var g=this.nextElementSibling;var c=this.querySelector('.msess-chevron');var open=g.style.display==='grid';g.style.display=open?'none':'grid';c.style.transform=open?'':'rotate(180deg)'">
            <span>Session Details</span>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="msess-detail-hint">Click to expand</span>
              <svg class="msess-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="msess-fields-grid" style="display:none">
            ${sf('Session Name', 'session_name', 'text', true)}
            ${sf('Start Time', 'session_start')}
            ${sf('End Time', 'session_end')}
            ${sf('Duration (min)', 'duration_min')}
            ${sf('Instructor', 'instructor')}
            ${sf('Location', 'location')}
            ${sf('Level', 'level')}
            ${sf('Category', 'category')}
            ${sf('Capacity', 'capacity')}
            ${sf('Spots Left', 'spots_left')}
            ${sf('Booked Count', 'booked_count')}
            ${sf('Late Cancelled', 'late_cancelled')}
            ${sf('Price', 'price')}
            ${sf('Is Recurring', 'is_recurring')}
            ${sf('Is In-Person', 'is_in_person')}
            ${sf('Description', 'description', 'text', true)}
            ${sf('Tags', 'tags', 'text', true)}
            ${sf('Teacher Email', 'teacher_email', 'email')}
            ${sf('Original Teacher', 'original_teacher')}
            ${sf('Additional Teachers', 'additional_teachers', 'text', true)}
            ${sf('Waitlist Capacity', 'waitlist_capacity')}
            ${sf('Waitlist Booked', 'waitlist_booked')}
            ${sf('Zoom Link', 'zoom_link', 'url', true)}
            ${sf('Online Stream URL', 'online_stream_url', 'url', true)}
          </div>
        </div>
        </div>
      </div>
    </div>`;
    }
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
    case 'image':
      inputHtml = `<input type="file" id="${field.id}" name="${field.name}"${required}${disabled} accept="image/*"${condAttrs} class="form-input${cssClass}">`;
      break;
    case 'video':
      inputHtml = `<input type="file" id="${field.id}" name="${field.name}"${required}${disabled} accept="video/*"${condAttrs} class="form-input${cssClass}">`;
      break;
    case 'pdf-viewer':
      inputHtml = `<input type="file" id="${field.id}" name="${field.name}"${required}${disabled} accept="application/pdf"${condAttrs} class="form-input${cssClass}">`;
      break;
    case 'voice-recording':
      inputHtml = `<div class="voice-recording-group${cssClass}"${condAttrs}>
        <button type="button" class="record-btn" onclick="startRecording('${field.id}')">🎤 Start Recording</button>
        <button type="button" class="stop-btn" onclick="stopRecording('${field.id}')" style="display:none;">⏹️ Stop</button>
        <audio id="${field.id}_preview" controls style="display:none;"></audio>
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    case 'social-links':
      inputHtml = `<div class="social-links-group${cssClass}"${condAttrs}>
        <input type="url" placeholder="Facebook URL" name="${field.name}_facebook" class="form-input social-link-input">
        <input type="url" placeholder="Instagram URL" name="${field.name}_instagram" class="form-input social-link-input">
        <input type="url" placeholder="Twitter URL" name="${field.name}_twitter" class="form-input social-link-input">
        <input type="url" placeholder="LinkedIn URL" name="${field.name}_linkedin" class="form-input social-link-input">
      </div>`;
      break;
    case 'address':
      inputHtml = `<textarea id="${field.id}" name="${field.name}"${required}${readonly}${disabled}${placeholder}${minLen}${maxLen}${condAttrs} class="form-input${cssClass}" rows="3" placeholder="Street address, city, state, zip…"></textarea>`;
      break;
    case 'currency':
      inputHtml = `<div class="currency-input-group${cssClass}"${condAttrs}>
        <span class="currency-symbol">$</span>
        <input type="number" id="${field.id}" name="${field.name}"${required}${readonly}${disabled} placeholder="${escapeHtml(field.placeholder || '0.00')}"${minVal}${maxVal}${stepVal}${autocomplete} class="form-input currency-input">
      </div>`;
      break;
    case 'ranking':
      inputHtml = `<div class="ranking-group${cssClass}"${condAttrs}>
        ${(field.options || []).map((o, i) => `<div class="ranking-item" data-value="${i + 1}"><span class="ranking-number">${i + 1}.</span> <span class="ranking-label">${escapeHtml(o.label)}</span></div>`).join('\n        ')}
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    case 'star-rating':
      const starMax = field.max || 5;
      inputHtml = `<div class="star-rating-group${cssClass}"${condAttrs}>
        ${Array.from({ length: starMax }, (_, i) => `<label class="star-rating-star"><input type="radio" name="${field.name}" value="${i + 1}"${required}> ★</label>`).join('\n        ')}
      </div>`;
      break;
    case 'opinion-scale':
      const scaleMin = field.min || 1;
      const scaleMax = field.max || 10;
      inputHtml = `<div class="opinion-scale-group${cssClass}"${condAttrs}>
        <div class="scale-labels">
          <span class="scale-min">${scaleMin}</span>
          <span class="scale-max">${scaleMax}</span>
        </div>
        <div class="scale-inputs">
          ${Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => `<label class="scale-option"><input type="radio" name="${field.name}" value="${scaleMin + i}"${required}> ${scaleMin + i}</label>`).join('\n          ')}
        </div>
      </div>`;
      break;
    case 'date-range':
      inputHtml = `<div class="date-range-group${cssClass}"${condAttrs}>
        <input type="date" id="${field.id}_start" name="${field.name}_start"${required}${disabled} class="form-input date-range-input" placeholder="Start date">
        <span class="date-range-separator">→</span>
        <input type="date" id="${field.id}_end" name="${field.name}_end"${required}${disabled} class="form-input date-range-input" placeholder="End date">
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    case 'picture-choice':
      inputHtml = `<div class="picture-choice-group${cssClass}"${condAttrs}>
        ${(field.options || []).map(o => `<label class="picture-choice-option"><input type="radio" name="${field.name}" value="${escapeHtml(o.value)}"${required}><img src="${escapeHtml(o.label)}" alt="Option" class="picture-choice-image"></label>`).join('\n        ')}
      </div>`;
      break;
    case 'multiselect':
      inputHtml = `<select id="${field.id}" name="${field.name}"${required}${disabled}${condAttrs}${autocomplete} class="form-input${cssClass}" multiple>
        ${(field.options || []).map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('\n        ')}
      </select>`;
      break;
    case 'switch':
      inputHtml = `<label class="switch-group${cssClass}"${condAttrs}>
        <input type="checkbox" id="${field.id}" name="${field.name}"${required}${disabled}>
        <span class="switch-slider"></span>
        <span class="switch-label">${escapeHtml(field.label)}</span>
      </label>`;
      break;
    case 'subform':
      inputHtml = `<div class="subform-group${cssClass}"${condAttrs}>
        <div class="subform-placeholder">Nested form fields will be rendered here</div>
      </div>`;
      break;
    case 'section-collapse':
      inputHtml = `<div class="section-collapse-group${cssClass}"${condAttrs}>
        <button type="button" class="collapse-toggle" onclick="toggleCollapse('${field.id}')">▶ ${escapeHtml(field.label)}</button>
        <div class="collapse-content" id="${field.id}_content" style="display:none;">
          <!-- Nested fields go here -->
        </div>
      </div>`;
      break;
    case 'divider':
      inputHtml = `<hr class="form-divider${cssClass}"${condAttrs}>`;
      break;
    case 'spacer':
      const spacerHeight = field.helpText || '20px';
      inputHtml = `<div class="form-spacer${cssClass}" style="height: ${spacerHeight};"${condAttrs}></div>`;
      break;
    case 'html-snippet':
      inputHtml = `<div class="html-snippet${cssClass}"${condAttrs}>${field.helpText || '<p>Custom HTML content</p>'}</div>`;
      break;
    case 'submission-picker':
      inputHtml = `<select id="${field.id}" name="${field.name}"${required}${disabled}${condAttrs} class="form-input${cssClass}">
        <option value="" disabled selected>Select from previous submissions</option>
        <!-- Options populated dynamically -->
      </select>`;
      break;
    case 'rich-text':
      inputHtml = `<div class="rich-text-editor${cssClass}"${condAttrs}>
        <div class="rte-toolbar">
          <button type="button" class="rte-btn" onclick="formatText('bold')">B</button>
          <button type="button" class="rte-btn" onclick="formatText('italic')">I</button>
          <button type="button" class="rte-btn" onclick="formatText('underline')">U</button>
        </div>
        <div id="${field.id}_editor" class="rte-editor" contenteditable="true" oninput="updateRichText('${field.id}')">${field.defaultValue || ''}</div>
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    case 'heading':
      return `<h2 class="form-heading"${hidden}${widthStyle}${condAttrs}>${escapeHtml(field.label)}</h2>`;
    case 'paragraph':
      return `<p class="form-paragraph"${hidden}${widthStyle}${condAttrs}>${escapeHtml(field.helpText || field.label)}</p>`;
    case 'banner':
      return `<div class="form-banner"${hidden}${widthStyle}${condAttrs} style="background-image: url('${escapeHtml(field.helpText || '')}');">
        <div class="banner-content">
          <h3>${escapeHtml(field.label)}</h3>
        </div>
      </div>`;
    default:
      inputHtml = `<input type="${field.type === 'color' || field.type === 'range' || field.type === 'date' || field.type === 'time' || field.type === 'datetime-local' || field.type === 'file' ? field.type : 'text'}" id="${field.id}" name="${field.name}"${required}${readonly}${disabled}${placeholder}${defaultVal}${minLen}${maxLen}${minVal}${maxVal}${stepVal}${pattern}${accept}${autocomplete}${condAttrs} class="form-input${cssClass}">`;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZWlvZGl2dWJodGNhZ3JsZnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTkxMjYsImV4cCI6MjA4MTU5NTEyNn0.QH_201DUxgNACmV9_48z1UUM5rFoy0-0yACIBBRkT2s';

  const supabaseSaveScript = `
                // Record submission in Supabase
                try {
                  console.log('Saving submission to Supabase...');
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
                  }).then(function(response) {
                    if (response.ok) {
                      console.log('Supabase submission saved successfully');
                    } else {
                      console.warn('Supabase submission failed:', response.status, response.statusText);
                      return response.text().then(function(text) {
                        console.warn('Supabase error details:', text);
                      });
                    }
                  }).catch(function(e) { 
                    console.warn('Supabase network error:', e); 
                  });
                } catch(e) {
                  console.warn('Supabase save exception:', e);
                }`;

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

function generateMomenceSearchScript(config: FormConfig): string {
  const hasMomenceField = config.fields.some(f => f.type === 'member-search');
  if (!hasMomenceField) return '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';
  return `
        // ── Momence Member Search ──────────────────────────────────────────────
        (function () {
          var PROXY_URL = '${supabaseUrl}/functions/v1/momence-proxy';

          function resolveHostId(wrap) {
            var staticId = parseInt(wrap.dataset.hostId || '33905', 10);
            var locFieldName = wrap.dataset.locationField || '';
            if (!locFieldName) return staticId;
            var locEl = document.querySelector('[name="' + locFieldName + '"]');
            if (!locEl) return staticId;
            var val = (locEl.value || '').toLowerCase();
            return (val.indexOf('kenkere') !== -1 || val.indexOf('copper') !== -1) ? 33905 : 13752;
          }

          function escHtml(s) {
            return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
          }
          // Format an ISO date as DD-MM-YYYY HH:MM:SS in IST (UTC+5:30)
          function fmtIST(iso) {
            if (!iso) return '';
            try {
              var d   = new Date(iso);
              var ist = new Date(d.getTime() + (5 * 60 + 30) * 60000);
              var p2  = function(n) { return n < 10 ? '0' + n : String(n); };
              return p2(ist.getUTCDate()) + '-' + p2(ist.getUTCMonth() + 1) + '-' + ist.getUTCFullYear()
                   + ' ' + p2(ist.getUTCHours()) + ':' + p2(ist.getUTCMinutes()) + ':' + p2(ist.getUTCSeconds());
            } catch(e) { return String(iso || ''); }
          }

          // Set a form field by name anywhere in the document
          function setField(name, val) {
            if (!name) return;
            var el = document.querySelector('[name="' + name + '"]');
            if (!el) return;
            el.value = val == null ? '' : String(val);
            el.dispatchEvent(new Event('input',  { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // ── Render dropdown ───────────────────────────────────────────────
          function renderResults(wrap, members) {
            var dd = wrap.querySelector('.member-search-dropdown');
            dd.innerHTML = '';
            if (!members || !members.length) {
              dd.innerHTML = '<div class="msr-empty">No members found for this search.</div>';
              dd.style.display = 'block';
              return;
            }
            members.forEach(function (m) {
              var item = document.createElement('div');
              item.className = 'msr-item';
              var initials = ((m.firstName || '?').charAt(0) + (m.lastName || '').charAt(0)).toUpperCase();
              var avatarEl;
              if (m.pictureUrl) {
                avatarEl = document.createElement('img');
                avatarEl.src = m.pictureUrl;
                avatarEl.className = 'msr-avatar';
                avatarEl.onerror = function () { this.style.display = 'none'; };
              } else {
                avatarEl = document.createElement('div');
                avatarEl.className = 'msr-avatar-placeholder';
                avatarEl.textContent = initials;
              }
              var contactParts = [];
              if (m.email)       contactParts.push(escHtml(m.email));
              if (m.phoneNumber) contactParts.push(escHtml(m.phoneNumber));
              var contactLine = contactParts.length ? '<div class="msr-contact">' + contactParts.join(' · ') + '</div>' : '';
              var statParts = [];
              if (m.sessionsBooked    != null) statParts.push('<span class="msr-stat">📅 ' + m.sessionsBooked + ' booked</span>');
              if (m.sessionsCheckedIn != null) statParts.push('<span class="msr-stat">✅ ' + m.sessionsCheckedIn + ' checked-in</span>');
              if (m.lateCancelled != null && m.lateCancelled > 0)
                statParts.push('<span class="msr-stat late-canc">⚠️ ' + m.lateCancelled + ' late cancel</span>');
              if (m.homeLocation) statParts.push('<span class="msr-stat location">📍 ' + escHtml(m.homeLocation) + '</span>');
              var stats = statParts.length ? '<div class="msr-stats">' + statParts.join('') + '</div>' : '';
              var tagsHtml = '';
              if (m.tags && m.tags.length)
                tagsHtml = '<div class="msr-tags">' + m.tags.map(function(t){ return '<span class="msr-tag">' + escHtml(t) + '</span>'; }).join('') + '</div>';
              item.appendChild(avatarEl);
              var infoEl = document.createElement('div');
              infoEl.className = 'msr-info';
              infoEl.innerHTML = '<div class="msr-name">' + escHtml((m.firstName || '') + ' ' + (m.lastName || '')) + '</div>' + contactLine + stats + tagsHtml;
              item.appendChild(infoEl);
              item.addEventListener('mousedown', function (e) {
                e.preventDefault();
                autoFill(wrap, m);
                dd.style.display = 'none';
              });
              dd.appendChild(item);
            });
            dd.style.display = 'block';
          }

          // ── Auto-fill: immediate (search result) + async (detail call) ───
          function autoFill(wrap, m) {
            var pfx = wrap.dataset.fieldPrefix || '';
            var inp = wrap.querySelector('.member-search-input');
            if (inp) inp.value = ((m.firstName || '') + ' ' + (m.lastName || '')).trim();
            var hid = wrap.querySelector('input[type=hidden]');
            if (hid) { hid.value = String(m.id || ''); hid.dispatchEvent(new Event('change', {bubbles:true})); }

            // ── Fill fields available from the search result immediately ──
            setField(pfx + '_first_name',          m.firstName);
            setField(pfx + '_last_name',           m.lastName);
            setField(pfx + '_email',               m.email);
            setField(pfx + '_phone',               m.phoneNumber);
            setField(pfx + '_sessions_booked',     m.sessionsBooked != null ? m.sessionsBooked : '');
            setField(pfx + '_sessions_checked_in', m.sessionsCheckedIn != null ? m.sessionsCheckedIn : '');
            setField(pfx + '_late_cancelled',      m.lateCancelled != null ? m.lateCancelled : '');
            setField(pfx + '_home_location',       m.homeLocation);
            setField(pfx + '_tags',                m.tags && m.tags.length ? m.tags.join(', ') : '');

            // ── Render profile card ──────────────────────────────────────
            var card = wrap.querySelector('.msr-member-card');
            if (card) {
              var photoWrap = card.querySelector('.msr-card-photo-wrap');
              photoWrap.innerHTML = '';
              var initials = ((m.firstName || '?').charAt(0) + (m.lastName || '').charAt(0)).toUpperCase();
              if (m.pictureUrl) {
                var img = document.createElement('img');
                img.src = m.pictureUrl; img.className = 'msr-card-photo';
                img.onerror = function () { photoWrap.innerHTML = '<div class="msr-card-initials">' + initials + '</div>'; };
                photoWrap.appendChild(img);
              } else {
                photoWrap.innerHTML = '<div class="msr-card-initials">' + initials + '</div>';
              }
              card.querySelector('.msr-card-name').textContent = ((m.firstName || '') + ' ' + (m.lastName || '')).trim();
              var cp = [];
              if (m.email) cp.push(escHtml(m.email));
              if (m.phoneNumber) cp.push(escHtml(m.phoneNumber));
              card.querySelector('.msr-card-contact').innerHTML = cp.join(' &middot; ');
              var sr = card.querySelector('.msr-card-stats-row');
              sr.innerHTML = '';
              function addStat(text, color) {
                var sp = document.createElement('span');
                sp.style.cssText = 'font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:' + color + ';';
                sp.textContent = text; sr.appendChild(sp);
              }
              if (m.sessionsBooked    != null) addStat('📅 ' + m.sessionsBooked + ' booked',       'rgba(99,102,241,0.12)');
              if (m.sessionsCheckedIn != null) addStat('✅ ' + m.sessionsCheckedIn + ' checked-in', 'rgba(16,185,129,0.12)');
              if (m.lateCancelled != null && m.lateCancelled > 0) addStat('⚠️ ' + m.lateCancelled + ' late cancel', 'rgba(245,158,11,0.12)');
              if (m.homeLocation) addStat('📍 ' + m.homeLocation, 'rgba(99,102,241,0.08)');
              var tr = card.querySelector('.msr-card-tags-row');
              tr.innerHTML = '';
              if (m.tags && m.tags.length) {
                m.tags.forEach(function (t) {
                  var sp = document.createElement('span');
                  sp.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:20px;background:var(--bg-primary);border:1px solid var(--border-color);color:var(--text-secondary);';
                  sp.textContent = t; tr.appendChild(sp);
                });
              }
              card.style.display = '';
            }

            // Show clear button and detail-fields section
            var clearBtn = wrap.querySelector('.msr-card-clear');
            if (clearBtn) clearBtn.style.display = '';
            var detailDiv = wrap.querySelector('.mmember-detail-fields');
            var loadingEl = wrap.querySelector('.mmember-detail-loading');
            if (detailDiv) detailDiv.style.display = '';
            if (loadingEl) loadingEl.style.display = '';

            // ── Secondary call: full member detail + memberships + history ─
            var hostId = resolveHostId(wrap);
            fetch(PROXY_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'detail', memberId: m.id, hostId: hostId }),
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (loadingEl) loadingEl.style.display = 'none';
              setField(pfx + '_first_seen',                d.firstSeen  ? fmtIST(d.firstSeen)  : '');
              setField(pfx + '_last_seen',                 d.lastSeen   ? fmtIST(d.lastSeen)   : '');
              setField(pfx + '_total_visits',              d.totalVisits != null ? d.totalVisits : '');
              setField(pfx + '_customer_tags',             d.customerTags && d.customerTags.length ? d.customerTags.join(', ') : '');
              var mem = d.activeMemberships && d.activeMemberships[0];
              if (mem) {
                setField(pfx + '_active_membership',           mem.name);
                setField(pfx + '_membership_type',             mem.type);
                setField(pfx + '_membership_end_date',         mem.endDate ? fmtIST(mem.endDate) : '');
                setField(pfx + '_membership_sessions_used',    mem.usedSessions != null ? mem.usedSessions : '');
                setField(pfx + '_membership_sessions_limit',   mem.usageLimitForSessions != null ? mem.usageLimitForSessions : '');
                setField(pfx + '_membership_frozen',           mem.isFrozen ? 'Yes' : 'No');
              }
              setField(pfx + '_recent_sessions_count',     d.recentSessionsCount != null ? d.recentSessionsCount : '');
              setField(pfx + '_last_session_name',         d.lastSessionName);
              setField(pfx + '_last_session_date',         d.lastSessionDate ? fmtIST(d.lastSessionDate) : '');
            })
            .catch(function() { if (loadingEl) loadingEl.style.display = 'none'; });
          }

          // ── Clear member ──────────────────────────────────────────────────
          function clearMember(wrap) {
            var pfx = wrap.dataset.fieldPrefix || '';
            var inp = wrap.querySelector('.member-search-input');
            var hid = wrap.querySelector('input[type=hidden]');
            var card = wrap.querySelector('.msr-member-card');
            var detailDiv = wrap.querySelector('.mmember-detail-fields');
            var clearBtn  = wrap.querySelector('.msr-card-clear');
            if (inp)       inp.value = '';
            if (hid)       { hid.value = ''; hid.dispatchEvent(new Event('change', {bubbles:true})); }
            if (card)      card.style.display = 'none';
            if (detailDiv) detailDiv.style.display = 'none';
            if (clearBtn)  clearBtn.style.display = 'none';
            var suffixes = [
              'first_name','last_name','email','phone','sessions_booked','sessions_checked_in',
              'late_cancelled','home_location','tags','customer_tags',
              'first_seen','last_seen','total_visits',
              'active_membership','membership_type','membership_end_date',
              'membership_sessions_used','membership_sessions_limit','membership_frozen',
              'recent_sessions_count','last_session_name','last_session_date',
            ];
            suffixes.forEach(function(sfx) {
              var el = document.querySelector('[name="' + pfx + '_' + sfx + '"]');
              if (el) { el.value = ''; el.dispatchEvent(new Event('change', {bubbles:true})); }
            });
          }

          // ── Per-widget wiring ─────────────────────────────────────────────
          document.querySelectorAll('[data-momence-search]').forEach(function (wrap) {
            var inp     = wrap.querySelector('.member-search-input');
            var dd      = wrap.querySelector('.member-search-dropdown');
            var btn     = wrap.querySelector('.member-search-btn');
            var spinner = wrap.querySelector('.member-search-spinner');
            var btnText = wrap.querySelector('.msr-btn-text');

            function setLoading(on) {
              btn.disabled = on;
              spinner.style.display = on ? 'inline-flex' : 'none';
              if (btnText) btnText.style.display = on ? 'none' : '';
            }

            function doSearch() {
              var q = inp ? inp.value.trim() : '';
              if (!q) return;
              setLoading(true);
              var hostId = resolveHostId(wrap);
              fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'search', query: q, hostId: hostId, pageSize: 20 }),
              })
              .then(function(r) { return r.json(); })
              .then(function(data) { renderResults(wrap, data.members || []); })
              .catch(function() {
                dd.innerHTML = '<div class="msr-empty">Search failed — check connection and try again.</div>';
                dd.style.display = 'block';
              })
              .finally(function() { setLoading(false); });
            }

            if (btn) btn.addEventListener('click', doSearch);
            if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
            var clearBtn = wrap.querySelector('.msr-card-clear');
            if (clearBtn) clearBtn.addEventListener('click', function() { clearMember(wrap); });
            document.addEventListener('mousedown', function(e) {
              if (dd && !wrap.contains(e.target)) dd.style.display = 'none';
            });
          });
        })();`;
}

function generateMomenceSessionsScript(config: FormConfig): string {
  const hasSessions = config.fields.some(f => f.type === 'momence-sessions');
  if (!hasSessions) return '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';
  return `
        // ── Momence Sessions Picker ────────────────────────────────────────────
        (function () {
          var SESS_URL = '${supabaseUrl}/functions/v1/momence-sessions';

          function pad(n) { return n < 10 ? '0' + n : String(n); }
          function toDateStr(d) {
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
          }
          function fmtDate(iso) {
            if (!iso) return '';
            var d = new Date(iso);
            return d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
          }
          function fmtTime(iso) {
            if (!iso) return '';
            return new Date(iso).toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
          }
          function fmtDateTime(iso) {
            return iso ? fmtDate(iso) + ' · ' + fmtTime(iso) : '';
          }
          // Format ISO date as DD-MM-YYYY HH:MM:SS in IST (UTC+5:30) — for stored field values
          function fmtIST(iso) {
            if (!iso) return '';
            try {
              var d   = new Date(iso);
              var ist = new Date(d.getTime() + (5 * 60 + 30) * 60000);
              var p2  = function(n) { return n < 10 ? '0' + n : String(n); };
              return p2(ist.getUTCDate()) + '-' + p2(ist.getUTCMonth() + 1) + '-' + ist.getUTCFullYear()
                   + ' ' + p2(ist.getUTCHours()) + ':' + p2(ist.getUTCMinutes()) + ':' + p2(ist.getUTCSeconds());
            } catch(e) { return String(iso || ''); }
          }
          // Like pick() but applies a formatter to each value before joining
          function pickFmt(sessions, prop, fmt) {
            return sessions.map(function(s) {
              var v = s[prop];
              return (v != null && v !== '') ? fmt(String(v)) : '';
            }).filter(Boolean).join(', ');
          }
          function escHtml(s) {
            return String(s == null ? '' : s)
              .replace(/&/g,'&amp;').replace(/</g,'&lt;')
              .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
          }
          // Write a value to a named form field & fire events
          function fillField(name, val) {
            if (!name || val == null || val === '') return;
            var el = document.querySelector('[name="' + name + '"]');
            if (!el) return;
            el.value = String(val);
            el.dispatchEvent(new Event('input',  { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          // Collect values from multiple sessions for a given property
          function pick(sessions, prop) {
            return sessions.map(function(s){ return s[prop] != null ? String(s[prop]) : ''; })
              .filter(Boolean).join(', ');
          }

          // ── render session list ───────────────────────────────────────────
          function renderSessions(wrap, sessions) {
            var list = wrap.querySelector('.msess-list');
            list.innerHTML = '';
            if (!sessions || !sessions.length) {
              list.innerHTML = '<div class="msess-placeholder">No sessions found for this date range.</div>';
              return;
            }
            var allowMultiple = wrap.dataset.allowMultiple === 'true';
            var inputType = allowMultiple ? 'checkbox' : 'radio';
            var hidEl = wrap.querySelector('input[type=hidden]');
            var groupName = 'msess_' + (hidEl ? hidEl.id : Math.random().toString(36).slice(2));

            sessions.forEach(function (s) {
              var item = document.createElement('label');
              item.className = 'msess-item';

              var check = document.createElement('input');
              check.type  = inputType;
              check.className = 'msess-check';
              check.name  = groupName;
              check.value = String(s.id);
              item.appendChild(check);

              var info = document.createElement('div');
              info.className = 'msess-item-info';

              // ─ Name row ─
              var nameDiv = document.createElement('div');
              nameDiv.className = 'msess-item-name';
              nameDiv.textContent = s.name || 'Session';
              info.appendChild(nameDiv);

              // ─ Primary meta: date/time, instructor, location ─
              var meta1 = [];
              if (s.startsAt)   meta1.push('<span>🗓 ' + escHtml(fmtDate(s.startsAt)) + ' &nbsp;⏰ ' + escHtml(fmtTime(s.startsAt)) + (s.endsAt ? ' – ' + escHtml(fmtTime(s.endsAt)) : '') + '</span>');
              if (s.instructor) meta1.push('<span>👤 ' + escHtml(s.instructor) + '</span>');
              if (s.location)   meta1.push('<span>📍 ' + escHtml(s.location)   + '</span>');
              if (meta1.length) {
                var m1 = document.createElement('div');
                m1.className = 'msess-item-meta';
                m1.innerHTML = meta1.join('');
                info.appendChild(m1);
              }

              // ─ Secondary meta: level, category, duration, price ─
              var meta2 = [];
              if (s.level)       meta2.push('<span>🏋️ ' + escHtml(s.level) + '</span>');
              if (s.category)    meta2.push('<span>🏷 ' + escHtml(s.category) + '</span>');
              if (s.durationMin) meta2.push('<span>⏱ ' + s.durationMin + ' min</span>');
              if (s.price != null && s.price !== '') meta2.push('<span>💰 ' + escHtml(String(s.price)) + '</span>');
              if (meta2.length) {
                var m2 = document.createElement('div');
                m2.className = 'msess-item-meta';
                m2.innerHTML = meta2.join('');
                info.appendChild(m2);
              }

              // ─ Capacity row: spots, booked, late cancelled ─
              var meta3 = [];
              if (s.spotsLeft   != null) meta3.push('<span style="color:#10b981;font-weight:600;">✅ ' + s.spotsLeft + ' spots left</span>');
              if (s.bookedCount != null) meta3.push('<span>📋 ' + s.bookedCount + ' booked</span>');
              if (s.capacity    != null) meta3.push('<span>👥 capacity ' + s.capacity + '</span>');
              if (s.lateCancelled != null && s.lateCancelled > 0)
                meta3.push('<span style="color:#f59e0b;font-weight:600;">⚠️ ' + s.lateCancelled + ' late cancel</span>');
              if (meta3.length) {
                var m3 = document.createElement('div');
                m3.className = 'msess-item-meta';
                m3.innerHTML = meta3.join('');
                info.appendChild(m3);
              }

              item.appendChild(info);

              // change handler: highlight + sync
              check.addEventListener('change', function () {
                if (!allowMultiple) {
                  list.querySelectorAll('.msess-item').forEach(function(el){ el.classList.remove('selected'); });
                }
                item.classList.toggle('selected', check.checked);
                syncHidden(wrap, sessions);
              });

              list.appendChild(item);
            });
          }

          // ── sync hidden field + auto-fill all prefix-named sub-fields ─────
          function syncHidden(wrap, sessions) {
            var pfx  = wrap.dataset.fieldPrefix || '';
            var hid  = wrap.querySelector('input[type=hidden]');
            var checks = Array.prototype.slice.call(wrap.querySelectorAll('.msess-check:checked'));
            var ids  = checks.map(function(c){ return c.value; });
            if (hid) { hid.value = ids.join(','); hid.dispatchEvent(new Event('change', { bubbles: true })); }

            var selected = ids.map(function(id){
              return sessions.find(function(x){ return String(x.id) === id; });
            }).filter(Boolean);

            // sv() always writes (even '') to clear stale values on deselect
            function sv(name, val) {
              var el = document.querySelector('[name="' + name + '"]');
              if (!el) return;
              el.value = val == null ? '' : String(val);
              el.dispatchEvent(new Event('input',  { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }

            sv(pfx + '_session_name',        pick(selected, 'name'));
            sv(pfx + '_session_start',        pickFmt(selected, 'startsAt', fmtIST));
            sv(pfx + '_session_end',          pickFmt(selected, 'endsAt',   fmtIST));
            sv(pfx + '_duration_min',         pick(selected, 'durationMin'));
            sv(pfx + '_instructor',           pick(selected, 'instructor'));
            sv(pfx + '_location',             pick(selected, 'location'));
            sv(pfx + '_level',                pick(selected, 'level'));
            sv(pfx + '_category',             pick(selected, 'category'));
            sv(pfx + '_capacity',             pick(selected, 'capacity'));
            sv(pfx + '_spots_left',           pick(selected, 'spotsLeft'));
            sv(pfx + '_booked_count',         pick(selected, 'bookedCount'));
            sv(pfx + '_late_cancelled',       pick(selected, 'lateCancelled'));
            sv(pfx + '_price',                pick(selected, 'price'));
            sv(pfx + '_is_recurring',         pick(selected, 'isRecurring'));
            sv(pfx + '_is_in_person',         pick(selected, 'isInPerson'));
            sv(pfx + '_description',          pick(selected, 'description'));
            sv(pfx + '_tags',                 pick(selected, 'tags'));
            sv(pfx + '_teacher_email',        pick(selected, 'teacherEmail'));
            sv(pfx + '_original_teacher',     pick(selected, 'originalTeacher'));
            sv(pfx + '_additional_teachers',  pick(selected, 'additionalTeachers'));
            sv(pfx + '_waitlist_capacity',    pick(selected, 'waitlistCapacity'));
            sv(pfx + '_waitlist_booked',      pick(selected, 'waitlistBookingCount'));
            sv(pfx + '_zoom_link',            pick(selected, 'zoomLink'));
            sv(pfx + '_online_stream_url',    pick(selected, 'onlineStreamUrl'));
          }

          // ── fetch & render ────────────────────────────────────────────────
          function loadSessions(wrap) {
            var btn     = wrap.querySelector('.msess-load-btn');
            var startEl = wrap.querySelector('.msess-start');
            var endEl   = wrap.querySelector('.msess-end');
            var list    = wrap.querySelector('.msess-list');
            var rangeDays = parseInt(wrap.dataset.rangeDays || '30', 10);

            var today  = new Date();
            var future = new Date(); future.setDate(today.getDate() + rangeDays);
            var startDate = startEl ? startEl.value : toDateStr(today);
            var endDate   = endEl   ? endEl.value   : toDateStr(future);

            if (btn) { btn.disabled = true; btn.classList.add('loading'); }
            list.innerHTML = '<div class="msess-placeholder">Loading sessions…</div>';

            fetch(SESS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ startDate: startDate, endDate: endDate }),
            })
              .then(function (r) { return r.json(); })
              .then(function (data) { renderSessions(wrap, data.sessions || []); })
              .catch(function () {
                list.innerHTML = '<div class="msess-error">Failed to load sessions — please try again.</div>';
              })
              .finally(function () {
                if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
              });
          }

          // ── init ──────────────────────────────────────────────────────────
          document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('[data-momence-sessions]').forEach(function (wrap) {
              var rangeDays = parseInt(wrap.dataset.rangeDays || '30', 10);
              var today  = new Date();
              var future = new Date(); future.setDate(today.getDate() + rangeDays);
              var startEl = wrap.querySelector('.msess-start');
              var endEl   = wrap.querySelector('.msess-end');
              if (startEl) startEl.value = toDateStr(today);
              if (endEl)   endEl.value   = toDateStr(future);

              var btn = wrap.querySelector('.msess-load-btn');
              if (btn) btn.addEventListener('click', function () { loadSessions(wrap); });

              // Auto-load on page ready
              loadSessions(wrap);
            });
          });
        })();`;}

function generateSheetsSubmitScript(config: FormConfig): string {
  const { googleSheetsConfig } = config;
  if (!googleSheetsConfig.enabled || !googleSheetsConfig.spreadsheetId) return '';
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';
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
  // Page 0 hero image overrides the global layout image for the initial panel render
  const initImg = config.pageHeroImages?.[0] ?? config.layoutImageUrl ?? '';
  const imgSrc = initImg ? `url('${initImg}')` : 'none';
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
    ? pages.map((pageFields, pi) => {
        return `
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
              </div>`;
      }).join('\n')
    : (() => {
        return `
                ${wrapFields(sortedFields)}
                <div style="margin-top: 20px;">
                    <button type="submit" class="submit-btn">${escapeHtml(config.submitButtonText)}</button>
                </div>`;
      })();

  const pageIndicatorHtml = isMultiPage 
    ? `<div class="page-indicator">${pages.map((_, i) => `<div class="page-dot${i === 0 ? ' active' : ''}" data-dot="${i}"></div>`).join('')}</div>`
    : '';

  const pageHeroMap = JSON.stringify(config.pageHeroImages ?? {});
  const defaultLayoutImg = config.layoutImageUrl ?? '';
  const multiPageScript = isMultiPage ? `
        var _PAGE_HERO = ${pageHeroMap};
        var _LAYOUT_IMG_DEFAULT = ${JSON.stringify(defaultLayoutImg)};
        function goToPage(n) {
            var allPages = document.querySelectorAll('.form-page');
            var dots = document.querySelectorAll('.page-dot');
            allPages.forEach(function(p) { p.classList.remove('active'); });
            dots.forEach(function(d) { d.classList.remove('active'); });
            allPages[n].classList.add('active');
            dots[n].classList.add('active');
            // Swap layout panel background to the hero image for this page
            var heroUrl = _PAGE_HERO[n] || _LAYOUT_IMG_DEFAULT;
            var panel = document.querySelector('.layout-image-panel') ||
                        document.querySelector('.layout-banner') ||
                        document.querySelector('.layout-backdrop');
            if (panel) {
                panel.style.backgroundImage = heroUrl ? "url('" + heroUrl + "')" : '';
            }
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
        .form-divider {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, var(--border-color) 0%, var(--border-color) 100%);
            margin: 12px 0;
            grid-column: 1 / -1;
        }
        .form-spacer {
            grid-column: 1 / -1;
        }
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

        /* ── Momence Member Search styles ──────────────────────────── */
        .member-search-wrap { position: relative; }
        .member-search-input-row { display: flex; align-items: center; gap: 8px; position: relative; }
        .member-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-light); pointer-events: none; flex-shrink: 0; }
        .member-search-input { flex: 1; padding-left: 40px !important; padding-right: 12px !important; }
        .member-search-btn {
          flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 42px; border-radius: 8px; border: none; cursor: pointer;
          background: var(--primary-gradient); color: white;
          font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
          transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
        }
        .member-search-btn:hover   { opacity: 0.88; }
        .member-search-btn:active  { transform: scale(0.97); }
        .member-search-btn:disabled{ opacity: 0.55; cursor: not-allowed; }
        .msr-btn-icon { flex-shrink: 0; }
        @keyframes msr-spin { to { transform: rotate(360deg); } }
        .msr-spin { animation: msr-spin 0.8s linear infinite; }
        .member-search-dropdown {
          position: absolute; z-index: 999; left: 0; right: 0; margin-top: 4px;
          background: var(--bg-primary); border: 2px solid var(--border-color);
          border-radius: 12px; box-shadow: 0 16px 40px -6px rgba(0,0,0,0.22);
          max-height: 420px; overflow-y: auto;
        }
        /* Result card */
        .msr-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 14px; cursor: pointer; transition: background 0.12s;
          border-bottom: 1px solid var(--border-color);
        }
        .msr-item:last-child { border-bottom: none; }
        .msr-item:hover { background: var(--bg-secondary); }
        .msr-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px; }
        .msr-avatar-placeholder {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
          display: flex; align-items: center; justify-content: center;
          background: var(--primary-gradient); color: white; font-weight: 700; font-size: 16px;
        }
        .msr-info { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 3px; }
        .msr-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .msr-contact { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* Stats row */
        .msr-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 3px; }
        .msr-stat {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 1px 7px; border-radius: 20px; font-size: 11px; font-weight: 600;
          background: rgba(99,102,241,0.10); color: #6366f1;
        }
        .msr-stat.late-canc { background: rgba(239,68,68,0.10); color: #ef4444; }
        .msr-stat.location  { background: rgba(16,185,129,0.10); color: #10b981; }
        /* Tags */
        .msr-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
        .msr-tag {
          padding: 1px 8px; border-radius: 20px; font-size: 10px; font-weight: 600;
          background: var(--bg-secondary); color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        .msr-empty { padding: 18px 14px; text-align: center; color: var(--text-secondary); font-size: 13px; }
        /* ── Member info card (shown after selection) ──────────────── */
        .msr-member-card {
          margin-top: 10px; border: 2px solid var(--border-color); border-radius: 10px;
          padding: 14px 14px 10px; background: var(--bg-secondary);
        }
        .msr-card-top { display: flex; align-items: center; gap: 12px; }
        .msr-card-photo-wrap { flex-shrink: 0; }
        .msr-card-photo { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; display: block; }
        .msr-card-initials {
          width: 46px; height: 46px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--primary-gradient); color: white; font-weight: 700; font-size: 18px; flex-shrink: 0;
        }
        .msr-card-identity { flex: 1; min-width: 0; }
        .msr-card-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .msr-card-contact { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .msr-card-clear {
          flex-shrink: 0; border: 1px solid var(--border-color); background: var(--bg-primary);
          cursor: pointer; color: var(--text-secondary); font-size: 13px; line-height: 1;
          padding: 4px 8px; border-radius: 6px; transition: all 0.12s;
        }
        .msr-card-clear:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }
        .msr-card-stats-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .msr-card-tags-row  { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        /* ── Momence Sessions Picker ───────────────────────────────── */
        .msess-wrap { position: relative; }
        .msess-controls {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
        }
        .msess-start, .msess-end { flex: 1; min-width: 130px; }
        .msess-sep { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
        .msess-load-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 42px; border-radius: 8px; border: none; cursor: pointer;
          background: var(--primary-gradient); color: white;
          font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
          transition: opacity 0.15s, transform 0.1s; white-space: nowrap; flex-shrink: 0;
        }
        .msess-load-btn:hover   { opacity: 0.88; }
        .msess-load-btn:active  { transform: scale(0.97); }
        .msess-load-btn:disabled{ opacity: 0.55; cursor: not-allowed; }
        .msess-load-btn svg { animation: none; }
        .msess-load-btn.loading svg { animation: msr-spin 0.8s linear infinite; }
        .msess-placeholder { padding: 18px 0; text-align: center; color: var(--text-secondary); font-size: 13px; }
        .msess-list { display: flex; flex-direction: column; gap: 6px; max-height: 380px; overflow-y: auto; }
        .msess-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 11px 13px; border: 2px solid var(--border-color); border-radius: 10px;
          cursor: pointer; transition: border-color 0.12s, background 0.12s;
          background: var(--bg-primary);
        }
        .msess-item:hover  { border-color: var(--primary-color); background: var(--bg-secondary); }
        .msess-item.selected { border-color: var(--primary-color); background: rgba(99,102,241,0.06); }
        .msess-check { margin-top: 2px; flex-shrink: 0; accent-color: var(--primary-color); width: 16px; height: 16px; cursor: pointer; }
        .msess-item-info { flex: 1; min-width: 0; }
        .msess-item-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .msess-item-meta {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
          font-size: 12px; color: var(--text-secondary);
        }
        .msess-item-meta span { white-space: nowrap; }
        /* ── Member Search Section ──────────────────────────────────── */
        .mmember-section {
          border: 2px solid var(--border-color); border-radius: 14px;
          background: var(--bg-secondary); padding: 0; overflow: visible;
        }
        .mmember-section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: var(--bg-primary);
          border-radius: 12px 12px 0 0; border-bottom: 2px solid var(--border-color);
        }
        .mmember-header-left { display: flex; align-items: center; gap: 8px; color: var(--primary-color); }
        .mmember-section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .mmember-search-row { padding: 14px 16px 0; position: relative; }
        .mmember-section .member-search-dropdown { left: 0; right: 0; }
        .mmember-section .msr-member-card { margin: 10px 16px 0; }
        .mmember-detail-fields { padding: 0 16px 16px; }
        .mmember-detail-divider {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0 8px; font-size: 11px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.06em;
          border-top: 1px solid var(--border-color); margin-top: 14px;
        }
        .mmember-detail-loading { font-weight: 400; normal-case: none; text-transform: none; color: var(--primary-color); font-size: 11px; }
        .mmember-fields-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        .mmember-field-group > label { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .mmember-field { background: var(--bg-primary) !important; font-size: 12.5px !important; color: var(--text-secondary) !important; }
        /* ── Sessions Section ────────────────────────────────────────── */
        .msess-section {
          border: 2px solid var(--border-color); border-radius: 14px;
          background: var(--bg-secondary); padding: 0; overflow: visible;
        }
        .msess-section-header {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; background: var(--bg-primary);
          border-radius: 12px 12px 0 0; border-bottom: 2px solid var(--border-color);
          color: var(--primary-color);
        }
        .msess-section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .msess-section > .msess-controls { padding: 12px 16px 0; }
        .msess-section > .msess-list { margin: 10px 16px 0; }
        .msess-detail-fields { padding: 0 16px 16px; }
        .msess-detail-divider {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0 8px; font-size: 11px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.06em;
          border-top: 1px solid var(--border-color); margin-top: 14px;
        }
        .msess-detail-hint { font-weight: 400; text-transform: none; color: var(--text-light); font-size: 11px; }
        .msess-fields-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        .msess-field-group > label { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .msess-field { background: var(--bg-primary) !important; font-size: 12.5px !important; color: var(--text-secondary) !important; }
        .msess-error { padding: 14px; text-align:center; color:#ef4444; font-size:13px; }
        @media (max-width: 520px) {
          .mmember-fields-grid, .msess-fields-grid { grid-template-columns: 1fr; }
        }
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
            <h1>${generateFormTitle(config)}</h1>
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
        ${generateMomenceSearchScript(config)}
        ${generateMomenceSessionsScript(config)}
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

import { FormConfig, FormField } from '@/types/formField';
import { getHeroForPage, normalizeHeroImageValue, resolveHeroBackgroundStyle } from '@/utils/heroImageConfig';

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
  previewMode?: boolean;
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
    case 'email-otp': {
      const cfg = field.emailOtpConfig || {};
      const otpLen = Math.max(4, Math.min(8, cfg.otpLength ?? 6));
      const otpExpiry = Math.max(1, Math.min(30, cfg.otpExpiryMinutes ?? 10));
      inputHtml = `<div class="email-otp-group${cssClass}"${condAttrs}
        data-email-otp="true"
        data-otp-length="${otpLen}"
        data-otp-expiry="${otpExpiry}"
        data-mailtrap-token="${escapeHtml(cfg.mailtrapToken || '')}"
        data-from-email="${escapeHtml(cfg.fromEmail || 'hello@physique57india.com')}"
        data-from-name="${escapeHtml(cfg.fromName || 'Physique 57 India')}"
        data-subject="${escapeHtml(cfg.subject || 'Your verification code')}"
        data-send-label="${escapeHtml(cfg.sendButtonText || 'Send OTP')}">
        <div class="email-otp-row">
          <input type="email" id="${field.id}_email" name="${field.name}_raw"${required}${readonly}${disabled}${placeholder}${autocomplete} class="form-input email-otp-email" />
          <button type="button" class="email-otp-send-btn">${escapeHtml(cfg.sendButtonText || 'Send OTP')}</button>
        </div>
        <div class="email-otp-row">
          <input type="text" id="${field.id}_otp" class="form-input email-otp-code" placeholder="Enter OTP" inputmode="numeric" maxlength="${otpLen}" />
          <button type="button" class="email-otp-verify-btn">${escapeHtml(cfg.verifyButtonText || 'Verify OTP')}</button>
        </div>
        <div class="email-otp-status" aria-live="polite"></div>
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    }
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
        <div class="msess-section-body">
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
          <div class="msess-fields-grid">
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
        <div class="msess-bookings"></div>
        <input type="hidden" name="${pfxS}_bookings_json">
        </div>
      </div>
    </div>`;
    }
    case 'hosted-class': {
      const hCfg = field.momenceSessionsConfig;
      const hRangeDays     = hCfg?.dateRangeDays ?? 30;
      const hAllowMultiple = hCfg?.allowMultiple !== false;
      const hShowDatePicker = hCfg?.showDatePicker !== false;
      const pfxH = escapeHtml(field.name);
      const reqMarkH = field.isRequired ? '<span class="required">*</span>' : '';
      const sfH = (lbl: string, nm: string, type = 'text', span2 = false) =>
        `<div class="form-group msess-field-group"${span2 ? ' style="grid-column:span 2"' : ''}>
              <label class="msess-field-label">${lbl}</label>
              <input type="${type}" name="${pfxH}_${nm}" readonly class="form-input msess-field" placeholder="Auto-filled">
            </div>`;
      return `
    <div class="form-group"${hidden}${widthStyle}>
      <div class="msess-section${cssClass}"${condAttrs}
        data-momence-sessions="true"
        data-session-type-filter="private"
        data-range-days="${hRangeDays}"
        data-allow-multiple="${hAllowMultiple}"
        data-field-prefix="${pfxH}">
        <div class="msess-section-header" style="cursor:pointer;justify-content:space-between" onclick="var b=this.nextElementSibling;var c=this.querySelector('.msess-hdr-chevron');var open=b.style.display!=='none';b.style.display=open?'none':'block';c.style.transform=open?'':'rotate(180deg)'">
          <div style="display:flex;align-items:center;gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span class="msess-section-title">${escapeHtml(field.label)}${reqMarkH}</span>
          </div>
          <svg class="msess-hdr-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="msess-section-body">
        ${hShowDatePicker ? `<div class="msess-controls">
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
          <div class="msess-fields-grid">
            ${sfH('Session Name', 'session_name', 'text', true)}
            ${sfH('Start Time', 'session_start')}
            ${sfH('End Time', 'session_end')}
            ${sfH('Duration (min)', 'duration_min')}
            ${sfH('Instructor', 'instructor')}
            ${sfH('Location', 'location')}
            ${sfH('Level', 'level')}
            ${sfH('Category', 'category')}
            ${sfH('Capacity', 'capacity')}
            ${sfH('Spots Left', 'spots_left')}
            ${sfH('Booked Count', 'booked_count')}
            ${sfH('Late Cancelled', 'late_cancelled')}
            ${sfH('Price', 'price')}
            ${sfH('Is Recurring', 'is_recurring')}
            ${sfH('Is In-Person', 'is_in_person')}
            ${sfH('Description', 'description', 'text', true)}
            ${sfH('Tags', 'tags', 'text', true)}
            ${sfH('Teacher Email', 'teacher_email', 'email')}
            ${sfH('Original Teacher', 'original_teacher')}
            ${sfH('Additional Teachers', 'additional_teachers', 'text', true)}
            ${sfH('Waitlist Capacity', 'waitlist_capacity')}
            ${sfH('Waitlist Booked', 'waitlist_booked')}
            ${sfH('Zoom Link', 'zoom_link', 'url', true)}
            ${sfH('Online Stream URL', 'online_stream_url', 'url', true)}
          </div>
        </div>
        <div class="msess-bookings"></div>
        <input type="hidden" name="${pfxH}_bookings_json">
        </div>
      </div>
    </div>`;
    }
    case 'appointment-slots': {
      const cfg = field.appointmentSlotsConfig || {};
      const cfgJson = escapeHtml(JSON.stringify(cfg));
      const tz = cfg.defaultTimezone || cfg.timezone || 'America/New_York';
      const tzDisplay = escapeHtml(tz);
      const useServicesMode = (cfg.services?.length ?? 0) > 0;

      if (useServicesMode) {
        // ── Services mode: one tab per service, slots from availableDates ──
        const services = cfg.services || [];
        const availDates = cfg.availableDates || [];
        const use12h = (cfg.timeFormat || '12h') === '12h';
        const bookingNote = cfg.bookingNote ? escapeHtml(cfg.bookingNote) : '';
        const tzDisplay2 = escapeHtml(cfg.defaultTimezone || tz);

        const serviceTabsHtml = services.map((svc, idx) => {
          const label = svc.name || `Service ${idx + 1}`;
          const subtitle = svc.with ? ` <span class="appt-svc-tab-sub">with ${escapeHtml(svc.with)}</span>` : '';
          return `<button type="button" class="appt-svc-tab${idx === 0 ? ' active' : ''}" data-svc-idx="${idx}">` +
            `<span class="appt-svc-tab-name">${escapeHtml(label)}</span>${subtitle}` +
            `<span class="appt-svc-tab-dur">${svc.durationMinutes} min</span>` +
            `</button>`;
        }).join('');

        const panelsHtml = services.map((svc, idx) => {
          const dateGroupsHtml = availDates.map(dateEntry => {
            const d = new Date(`${dateEntry.date}T00:00:00`);
            const dateLabel = escapeHtml(d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
            return `<div class="appt-svc-date-group" data-date="${escapeHtml(dateEntry.date)}" data-svc-id="${escapeHtml(svc.id)}">` +
              `<div class="appt-svc-date-header">${dateLabel}</div>` +
              `<div class="appt-svc-slots-row"></div>` +
              `</div>`;
          }).join('');
          return `<div class="appt-svc-panel${idx === 0 ? ' active' : ''}" data-svc-panel-idx="${idx}"` +
            `${idx !== 0 ? ' hidden' : ''}>` +
            `${dateGroupsHtml || '<div class="appt-no-slots">No dates configured.</div>'}` +
            `</div>`;
        }).join('');

        inputHtml = `<div class="appt-booking appt-services-mode${cssClass}"${condAttrs}
          data-appt="true"
          data-appt-mode="services"
          data-field-name="${escapeHtml(field.name)}"
          data-field-id="${escapeHtml(field.id)}"
          data-appt-config="${cfgJson}">
          ${bookingNote ? `<div class="appt-svc-booking-note">${bookingNote}</div>` : ''}
          ${services.length > 1 ? `<div class="appt-svc-tabs-row">${serviceTabsHtml}</div>` : `<div class="appt-svc-single-header">${services[0] ? `<span class="appt-svc-tab-name">${escapeHtml(services[0].name || 'Appointment')}</span>${services[0].with ? `<span class="appt-svc-tab-sub"> with ${escapeHtml(services[0].with)}</span>` : ''}<span class="appt-svc-tab-dur">${services[0].durationMinutes} min</span>` : ''}</div>`}
          <div class="appt-svc-panels">${panelsHtml}</div>
          <div class="appt-svc-tz-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span class="appt-svc-tz-label">${tzDisplay2}</span>
          </div>
          <div class="appt-svc-selection-summary" aria-live="polite"></div>
          <input type="hidden" id="${field.id}" name="${field.name}"${required}>
        </div>`;
      } else {
        // ── Legacy calendar mode ─────────────────────────────────────────
        inputHtml = `<div class="appt-booking${cssClass}"${condAttrs}
          data-appt="true"
          data-field-name="${escapeHtml(field.name)}"
          data-field-id="${escapeHtml(field.id)}"
          data-appt-config="${cfgJson}">
        <div class="appt-date-row">
          <input type="text" class="appt-date-input form-input" readonly placeholder="${escapeHtml(cfg.dateFormat || 'MM/DD/YYYY')}">
          <button type="button" class="appt-cal-toggle" aria-label="Open calendar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
        </div>
        <div class="appt-main-panel">
          <div class="appt-cal-panel">
            <div class="appt-month-year-nav">
              <div class="appt-nav-ctrl">
                <select class="appt-month-sel appt-sel"></select>
                <div class="appt-arrows">
                  <button type="button" class="appt-arrow-btn appt-month-prev">&#8743;</button>
                  <button type="button" class="appt-arrow-btn appt-month-next">&#8744;</button>
                </div>
              </div>
              <div class="appt-nav-ctrl">
                <select class="appt-year-sel appt-sel"></select>
                <div class="appt-arrows">
                  <button type="button" class="appt-arrow-btn appt-year-prev">&#8743;</button>
                  <button type="button" class="appt-arrow-btn appt-year-next">&#8744;</button>
                </div>
              </div>
            </div>
            <div class="appt-day-headers"></div>
            <div class="appt-days-grid"></div>
          </div>
          <div class="appt-slots-panel">
            <div class="appt-slots-header">
              <button type="button" class="appt-day-nav appt-prev-day">&#8249;</button>
              <span class="appt-selected-day-label">Select a date</span>
              <button type="button" class="appt-day-nav appt-next-day">&#8250;</button>
            </div>
            <div class="appt-slot-detail" aria-live="polite">
              <div class="appt-slot-detail-title">Choose a time slot</div>
              <div class="appt-slot-detail-meta">Hover or tap a slot to view class, teacher, and duration details.</div>
            </div>
            <div class="appt-time-slots-grid"></div>
            <div class="appt-tz-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span class="appt-tz-label">${tzDisplay}</span>
              <span class="appt-tz-offset"></span>
              ${!cfg.lockTimezone ? `<button type="button" class="appt-tz-toggle">&#9660;</button>` : ''}
            </div>
          </div>
        </div>
        <input type="hidden" id="${field.id}" name="${field.name}"${required}>
      </div>`;
      }
      break;
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
          <option value="+91" selected>India (+91)</option>
          <option value="+1">United States (+1)</option>
          <option value="+44">United Kingdom (+44)</option>
          <option value="+971">United Arab Emirates (+971)</option>
          <option value="+65">Singapore (+65)</option>
          <option value="+63">Philippines (+63)</option>
          <option value="+33">France (+33)</option>
          <option value="+49">Germany (+49)</option>
          <option value="+81">Japan (+81)</option>
          <option value="+86">China (+86)</option>
          <option value="+61">Australia (+61)</option>
          <option value="+34">Spain (+34)</option>
          <option value="+60">Malaysia (+60)</option>
          <option value="+966">Saudi Arabia (+966)</option>
          <option value="+974">Qatar (+974)</option>
          <option value="+31">Netherlands (+31)</option>
          <option value="+41">Switzerland (+41)</option>
        </select>
        <input type="tel" id="${field.id}_number" name="${field.name}_raw"${required}${readonly}${disabled} placeholder="${escapeHtml(field.placeholder || 'Phone number')}"${minLen}${maxLen}${pattern}${autocomplete} class="form-input phone-number-input" oninput="updatePhoneValue('${field.id}')">
        <input type="hidden" id="${field.id}" name="${field.name}">
      </div>`;
      break;
    case 'image': {
      const imgSrc = field.defaultValue || field.placeholder || '';
      const imgAlt = field.helpText || field.label || 'Image';
      inputHtml = imgSrc
        ? `<div class="media-display image-display${cssClass}"${condAttrs}>
            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" style="max-width:100%;height:auto;border-radius:8px;display:block;">
            ${field.helpText ? `<p class="help-text" style="margin-top:6px;text-align:center;">${escapeHtml(field.helpText)}</p>` : ''}
          </div>`
        : `<div class="media-display image-placeholder${cssClass}"${condAttrs} style="border:2px dashed #ddd;border-radius:12px;padding:32px;text-align:center;color:#999;">
            <p style="margin:0;font-size:14px;">🖼️ Image URL not set</p>
            <p style="margin:4px 0 0;font-size:12px;">Set the image URL in the field's Default Value or Placeholder</p>
          </div>`;
      break;
    }
    case 'video': {
      const vidSrc = field.defaultValue || field.placeholder || '';
      const isYoutube = vidSrc.includes('youtube.com') || vidSrc.includes('youtu.be');
      const isVimeo = vidSrc.includes('vimeo.com');
      if (vidSrc && (isYoutube || isVimeo)) {
        let embedUrl = vidSrc;
        if (isYoutube) {
          const match = vidSrc.match(/(?:v=|youtu\.be\/)([^&?#]+)/);
          if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
        } else if (isVimeo) {
          const match = vidSrc.match(/vimeo\.com\/(\d+)/);
          if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
        }
        inputHtml = `<div class="media-display video-display${cssClass}"${condAttrs}>
            <iframe src="${escapeHtml(embedUrl)}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;" allowfullscreen></iframe>
          </div>`;
      } else if (vidSrc) {
        inputHtml = `<div class="media-display video-display${cssClass}"${condAttrs}>
            <video src="${escapeHtml(vidSrc)}" controls style="max-width:100%;border-radius:8px;display:block;"></video>
          </div>`;
      } else {
        inputHtml = `<div class="media-display video-placeholder${cssClass}"${condAttrs} style="border:2px dashed #ddd;border-radius:12px;padding:32px;text-align:center;color:#999;">
            <p style="margin:0;font-size:14px;">🎬 Video URL not set</p>
            <p style="margin:4px 0 0;font-size:12px;">Set a YouTube, Vimeo, or direct video URL in Default Value</p>
          </div>`;
      }
      break;
    }
    case 'pdf-viewer': {
      const pdfSrc = field.defaultValue || field.placeholder || '';
      inputHtml = pdfSrc
        ? `<div class="media-display pdf-display${cssClass}"${condAttrs}>
            <iframe src="${escapeHtml(pdfSrc)}" style="width:100%;height:500px;border:1px solid #e2e8f0;border-radius:8px;" title="${escapeHtml(field.label)}"></iframe>
          </div>`
        : `<div class="media-display pdf-placeholder${cssClass}"${condAttrs} style="border:2px dashed #ddd;border-radius:12px;padding:32px;text-align:center;color:#999;">
            <p style="margin:0;font-size:14px;">📄 PDF URL not set</p>
            <p style="margin:4px 0 0;font-size:12px;">Set the PDF URL in Default Value</p>
          </div>`;
      break;
    }
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

function generatePixelScripts(config: FormConfig, previewMode = false): string {
  if (previewMode) return '';
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
  const hasAppointmentSlots = config.fields.some(f => f.type === 'appointment-slots');
  
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

  const appointmentGate = hasAppointmentSlots
    ? `
            var appointmentValidation = window.__validateAppointmentBooking
              ? window.__validateAppointmentBooking(this)
              : Promise.resolve({ ok: true });

            appointmentValidation.then(function(result) {
                if (result && result.ok === false) {
                    throw new Error(result.message || 'Selected appointment slot is no longer available.');
                }`
    : '';

  const appointmentGateClose = hasAppointmentSlots ? `
            }).catch(function(error) {
                console.error('Error:', error);
                reportSubmitStatus(error && error.message ? error.message : 'Submission failed.', true);
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.textContent = '${escapeHtml(config.submitButtonText)}';
                }
            });` : '';

  if (!webhookConfig.enabled) {
    return `
        function reportSubmitStatus(message, isError) {
            var statusEl = document.getElementById('form-status');
            if (!statusEl) return;
            statusEl.textContent = message || '';
            statusEl.className = 'form-status' + (isError ? ' is-error' : ' is-success');
            statusEl.style.display = message ? 'block' : 'none';
        }

        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var formEl = this;
            reportSubmitStatus('', false);
            var submitBtn = formEl.querySelector('.submit-btn');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }
            ${appointmentGate}
            var formData = new FormData(formEl);
            Array.from(formData.keys()).forEach(function(k) { if (k.endsWith('_raw')) formData.delete(k); });
            var baseData = Object.fromEntries(formData);
            var data = baseData;
            console.log('Form submitted:', baseData);${pixelEvents}
            ${generateSheetsSubmitScript(config)}
            ${supabaseSaveScript}
            reportSubmitStatus('${escapeHtml(config.successMessage)}', false);
            ${redirectLine}${appointmentGateClose}
        });`;
  }

  return `${utmScript}

        function reportSubmitStatus(message, isError) {
            var statusEl = document.getElementById('form-status');
            if (!statusEl) return;
            statusEl.textContent = message || '';
            statusEl.className = 'form-status' + (isError ? ' is-error' : ' is-success');
            statusEl.style.display = message ? 'block' : 'none';
        }

        document.getElementById('generated-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var formEl = this;
            reportSubmitStatus('', false);
            var submitBtn = formEl.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            ${appointmentGate}
            var formData = new FormData(formEl);
            // Remove raw shadow inputs, keep combined hidden values
            Array.from(formData.keys()).forEach(function(k) { if (k.endsWith('_raw')) formData.delete(k); });
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
                reportSubmitStatus('${escapeHtml(config.successMessage)}', false);
                ${redirectLine}
            }).catch(function(error) {
                console.error('Error:', error);
                reportSubmitStatus(error && error.message ? error.message : 'Submission failed.', true);
                submitBtn.disabled = false;
                submitBtn.textContent = '${escapeHtml(config.submitButtonText)}';
            });${appointmentGateClose}
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
  const hasSessions = config.fields.some(f => f.type === 'momence-sessions' || f.type === 'hosted-class');
  if (!hasSessions) return '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZWlvZGl2dWJodGNhZ3JsZnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTkxMjYsImV4cCI6MjA4MTU5NTEyNn0.QH_201DUxgNACmV9_48z1UUM5rFoy0-0yACIBBRkT2s';
  return `
        // ── Momence Sessions Picker ────────────────────────────────────────────
        (function () {
          var SESS_URL = '${supabaseUrl}/functions/v1/momence-sessions';
          var SESS_KEY = '${supabaseAnonKey}';

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

          // ── normalize raw Momence API shape → enriched shape ───────────────
          function normalizeSession(s) {
            var instructor = s.instructor;
            if (!instructor && s.teacher) {
              instructor = ((s.teacher.firstName || '') + ' ' + (s.teacher.lastName || '')).trim();
            }
            var location = s.location || (s.inPersonLocation && s.inPersonLocation.name) || null;
            var durationMin = s.durationMin != null ? s.durationMin : (s.durationInMinutes != null ? s.durationInMinutes : null);
            var bookedCount = s.bookedCount != null ? s.bookedCount : (s.bookingCount != null ? s.bookingCount : null);
            var spotsLeft = s.spotsLeft != null ? s.spotsLeft
              : (s.capacity != null && bookedCount != null ? Math.max(0, s.capacity - bookedCount) : null);
            var tags = s.tags;
            if (Array.isArray(tags)) {
              tags = tags.map(function(t){ return typeof t === 'string' ? t : (t.name || t.label || ''); }).filter(Boolean).join(', ');
            }
            return Object.assign({}, s, {
              instructor: instructor,
              location: location,
              durationMin: durationMin,
              bookedCount: bookedCount,
              spotsLeft: spotsLeft,
              tags: tags,
            });
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

          // ── fetch bookings for a selected session ──────────────────────────
          function loadBookings(wrap, sessionId) {
            var bWrap = wrap.querySelector('.msess-bookings');
            if (!bWrap) return;
            bWrap.innerHTML = '<div class="msess-bookings-loading">Loading bookings…</div>';
            fetch(SESS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': SESS_KEY, 'Authorization': 'Bearer ' + SESS_KEY },
              body: JSON.stringify({ action: 'bookings', sessionId: sessionId }),
            })
              .then(function(r) { return r.json(); })
              .then(function(data) { renderBookings(wrap, data.bookings || []); })
              .catch(function() { bWrap.innerHTML = '<div class="msess-bookings-error">Failed to load bookings.</div>'; });
          }

          function renderBookings(wrap, bookings) {
            var bWrap = wrap.querySelector('.msess-bookings');
            var pfx = wrap.dataset.fieldPrefix || '';
            if (!bWrap) return;
            if (!bookings.length) {
              bWrap.innerHTML = '<div class="msess-bookings-empty">No bookings found for this session.</div>';
              return;
            }
            var STATUSES = ['','Trial Scheduled','Not Interested - Other','Trial Completed','Shared Pricing & Schedule Details','Membership Sold','Client Unresponsive','New Enquiry','Sent Introductory message','Shared Class Descriptions and Benefits','Post Trial Follow Up','Not Interested - Proximity Issues','Will get back to us at a later date','Lead Dropped or Lost','Called - Did Not Answer','Called - Asked to Call back later','Language Barrier - Couldn\'t comprehend or speak the language','Called - Invalid Contact No','Not Interested - Timings not suitable','Not Interested - Pricing Issues','Trial Rescheduled','Not Interested - Health Issues','Initial Contact','No Response after Trial','Trial Completed - Other Issues','Trial Completed - Unresponsive','Will come back once I exhaust my current gym membership','Trial Completed - Proximity Issues','Trial Completed - Pricing Issues','Trial Completed - Currently Travelling','Called - Client out of town/traveling','Shared Pricing & Schedule details on WhatsApp','Called - Did not answer','Sent Introductory Message','Looking for Virtual Classes','Followed up with Trial Participants','Shared Membership Packages And Exclusive Deals','Looking For Virtual Classes','Positive Trial Feedback - Interested in Membership'];
            var statusOpts = STATUSES.map(function(s){ return '<option value="'+escHtml(s)+'">'+(s||'-- Select Status --')+'</option>'; }).join('');
            var html = '<div class="msess-bookings-header"><span>Bookings (' + bookings.length + ')</span></div>';
            html += '<div class="msess-bookings-scroll"><table class="msess-bookings-table"><thead><tr>';
            html += '<th>#</th><th>Member</th><th>Email</th><th>Phone</th><th>Checked In</th><th>Tickets</th><th>Status</th><th>Comment</th>';
            html += '</tr></thead><tbody>';
            bookings.forEach(function(b, i) {
              var m = b.member || {};
              var name = ((m.firstName || '') + ' ' + (m.lastName || '')).trim() || '\u2014';
              var isCancelled = !!b.cancelledAt;
              var isCheckedIn = !!b.checkedIn;
              html += '<tr' + (isCancelled ? ' class="msess-row-cancelled"' : '') + '>';
              html += '<td class="msess-td-num">' + (i + 1) + '</td>';
              html += '<td class="msess-td-name">';
              if (m.pictureUrl) html += '<img src="' + escHtml(m.pictureUrl) + '" class="msess-member-avatar" alt="">';
              html += escHtml(name);
              if (isCancelled) html += ' <span class="msess-cancelled-badge">Cancelled</span>';
              html += '</td>';
              html += '<td>' + escHtml(m.email || '\u2014') + '</td>';
              html += '<td>' + escHtml(m.phoneNumber || '\u2014') + '</td>';
              html += '<td style="text-align:center">' + (isCheckedIn ? '\u2705' : '\u2014') + '</td>';
              html += '<td style="text-align:center">' + (b.ticketsBought != null ? b.ticketsBought : '\u2014') + '</td>';
              html += '<td><select class="form-input msess-booking-status" data-member-id="' + escHtml(String(m.id || i)) + '" data-member-name="' + escHtml(name) + '">' + statusOpts + '</select></td>';
              html += '<td><textarea class="form-input msess-booking-comment" rows="2" data-member-id="' + escHtml(String(m.id || i)) + '" data-member-name="' + escHtml(name) + '" data-checked-in="' + (isCheckedIn ? '1' : '0') + '" placeholder="' + (isCheckedIn ? 'Required for checked-in members\u2026' : 'Add comment\u2026') + '"' + (isCheckedIn ? ' required' : '') + '></textarea></td>';
              html += '</tr>';
            });
            html += '</tbody></table></div>';
            html += '<button type="button" class="msess-save-comments-btn">\ud83d\udcbe Save Comments</button>';
            bWrap.innerHTML = html;
            bWrap.querySelector('.msess-save-comments-btn').addEventListener('click', function() {
              var invalid = false;
              bWrap.querySelectorAll('.msess-booking-comment').forEach(function(ta) {
                if (ta.dataset.checkedIn === '1' && !ta.value.trim()) {
                  ta.style.borderColor = '#ef4444';
                  invalid = true;
                } else {
                  ta.style.borderColor = '';
                }
              });
              if (invalid) {
                alert('Please add a comment for all checked-in members before saving.');
                return;
              }
              var rows = [];
              bWrap.querySelectorAll('.msess-booking-comment').forEach(function(ta) {
                var statusEl = bWrap.querySelector('.msess-booking-status[data-member-id="' + ta.dataset.memberId + '"]');
                rows.push({ memberId: ta.dataset.memberId, memberName: ta.dataset.memberName, status: statusEl ? statusEl.value : '', comment: ta.value });
              });
              var hidEl = wrap.querySelector('[name="' + pfx + '_bookings_json"]');
              if (hidEl) {
                hidEl.value = JSON.stringify(rows);
                hidEl.dispatchEvent(new Event('change', { bubbles: true }));
              }
              var btn = bWrap.querySelector('.msess-save-comments-btn');
              btn.textContent = '\u2705 Comments Saved';
              setTimeout(function() { btn.textContent = '\ud83d\udcbe Save Comments'; }, 2000);
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

            // hide session list, show detail fields when a selection is made
            var list = wrap.querySelector('.msess-list');
            var grid = wrap.querySelector('.msess-fields-grid');
            var detailFields = wrap.querySelector('.msess-detail-fields');
            var detailDivider = wrap.querySelector('.msess-detail-divider');
            if (ids.length > 0) {
              if (list) list.style.display = 'none';
              if (grid) grid.style.display = 'grid';
              if (detailFields) detailFields.style.display = 'block';
              if (detailDivider) detailDivider.style.display = 'none';
            } else {
              if (list) list.style.display = 'flex';
              if (grid) grid.style.display = 'none';
              if (detailFields) detailFields.style.display = 'none';
            }

            // sv() writes into this wrap's scoped fields
            function sv(name, val) {
              var el = wrap.querySelector('[name="' + name + '"]');
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

            if (ids.length === 1) {
              loadBookings(wrap, ids[0]);
            } else {
              var bWrap = wrap.querySelector('.msess-bookings');
              if (bWrap) bWrap.innerHTML = '';
            }
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
            var typeFilter = wrap.dataset.sessionTypeFilter || '';

            if (btn) { btn.disabled = true; btn.classList.add('loading'); }
            list.innerHTML = '<div class="msess-placeholder">Loading sessions…</div>';

            var reqBody = { startDate: startDate, endDate: endDate };
            if (typeFilter) reqBody.types = typeFilter;

            fetch(SESS_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SESS_KEY,
                'Authorization': 'Bearer ' + SESS_KEY,
              },
              body: JSON.stringify(reqBody),
            })
              .then(function (r) { return r.json(); })
              .then(function (data) { 
                var normalized = (data.sessions || data.payload || []).map(normalizeSession);
                renderSessions(wrap, normalized);
                // hide detail fields until a session is selected
                var grid = wrap.querySelector('.msess-fields-grid');
                var detailFields = wrap.querySelector('.msess-detail-fields');
                if (grid) grid.style.display = 'none';
                if (detailFields) detailFields.style.display = 'none';
              })
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

function generateEmailOtpScript(config: FormConfig): string {
  const hasEmailOtp = config.fields.some(f => f.type === 'email-otp');
  if (!hasEmailOtp) return '';

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  return `
        (function () {
          var OTP_URL = '${supabaseUrl}/functions/v1/send-email-otp';

          function status(el, text, isError) {
            if (!el) return;
            el.textContent = text || '';
            el.style.color = isError ? '#ef4444' : 'var(--text-secondary)';
          }

          function bindEmailOtp(wrap) {
            var emailInput = wrap.querySelector('.email-otp-email');
            var otpInput = wrap.querySelector('.email-otp-code');
            var sendBtn = wrap.querySelector('.email-otp-send-btn');
            var verifyBtn = wrap.querySelector('.email-otp-verify-btn');
            var statusEl = wrap.querySelector('.email-otp-status');
            var hidden = wrap.querySelector('input[type=\"hidden\"]');

            function clearVerification() {
              wrap.dataset.currentOtp = '';
              wrap.dataset.otpExpiryAt = '';
              wrap.dataset.verified = '';
              if (hidden) hidden.value = '';
            }

            emailInput.addEventListener('input', clearVerification);

            sendBtn.addEventListener('click', function () {
              var email = (emailInput.value || '').trim();
              if (!email) {
                status(statusEl, 'Enter an email address first.', true);
                return;
              }

              var token = wrap.dataset.mailtrapToken || '';
              if (!token) {
                status(statusEl, 'Missing Mailtrap token in field settings.', true);
                return;
              }

              sendBtn.disabled = true;
              sendBtn.textContent = 'Sending...';
              status(statusEl, 'Sending OTP…', false);

              fetch(OTP_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': '${supabaseAnonKey}',
                  'Authorization': 'Bearer ${supabaseAnonKey}'
                },
                body: JSON.stringify({
                  to: email,
                  fromEmail: wrap.dataset.fromEmail || 'hello@physique57india.com',
                  fromName: wrap.dataset.fromName || 'Physique 57 India',
                  subject: wrap.dataset.subject || 'Your verification code',
                  otpLength: Number(wrap.dataset.otpLength || '6'),
                  mailtrapToken: token,
                  expiryMinutes: Number(wrap.dataset.otpExpiry || '10')
                })
              })
                .then(function (res) { return res.json(); })
                .then(function (payload) {
                  if (!payload || !payload.success || !payload.otp) {
                    throw new Error((payload && payload.error) || 'OTP send failed');
                  }
                  wrap.dataset.currentOtp = String(payload.otp);
                  wrap.dataset.otpExpiryAt = String(Date.now() + Number(wrap.dataset.otpExpiry || '10') * 60000);
                  wrap.dataset.verified = '';
                  if (hidden) hidden.value = '';
                  status(statusEl, 'OTP sent. Check your email and enter it below.', false);
                })
                .catch(function (err) {
                  status(statusEl, err && err.message ? err.message : 'Failed to send OTP.', true);
                })
                .finally(function () {
                  sendBtn.disabled = false;
                  sendBtn.textContent = wrap.dataset.sendLabel || 'Send OTP';
                });
            });

            verifyBtn.addEventListener('click', function () {
              var entered = (otpInput.value || '').trim();
              var expected = wrap.dataset.currentOtp || '';
              var expiresAt = Number(wrap.dataset.otpExpiryAt || '0');

              if (!expected) {
                status(statusEl, 'Send OTP first.', true);
                return;
              }
              if (!entered) {
                status(statusEl, 'Enter the OTP code.', true);
                return;
              }
              if (Date.now() > expiresAt) {
                clearVerification();
                status(statusEl, 'OTP expired. Please request a new code.', true);
                return;
              }
              if (entered !== expected) {
                status(statusEl, 'Invalid OTP. Please try again.', true);
                return;
              }

              wrap.dataset.verified = 'true';
              if (hidden) hidden.value = (emailInput.value || '').trim();
              status(statusEl, 'Email verified successfully.', false);
            });
          }

          document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('[data-email-otp=\"true\"]').forEach(bindEmailOtp);

            var form = document.getElementById('generated-form');
            if (!form) return;
            form.addEventListener('submit', function (e) {
              var groups = document.querySelectorAll('[data-email-otp=\"true\"]');
              for (var i = 0; i < groups.length; i++) {
                var g = groups[i];
                var hidden = g.querySelector('input[type=\"hidden\"]');
                var verified = g.dataset.verified === 'true';
                if (hidden && !verified) {
                  e.preventDefault();
                  status(g.querySelector('.email-otp-status'), 'Please verify your email before submitting.', true);
                  return;
                }
              }
            });
          });
        })();`;
}

function generateAppointmentSlotsScript(config: FormConfig): string {
  const hasAppointmentSlots = config.fields.some(f => f.type === 'appointment-slots');
  if (!hasAppointmentSlots) return '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oleiodivubhtcagrlfug.supabase.co';

  return `
        // ── Appointment Booking Calendar ──────────────────────────────────────
        (function () {
          var APPT_FORM_ID = '${escapeHtml(config.id)}';
          var APPT_COUNTS_URL = '${supabaseUrl}/functions/v1/appointment-bookings';
          var MONTHS = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
          var DAYS_SHORT_SUN = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
          var DAYS_SHORT_MON = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

          function pad(n) { return n < 10 ? '0' + n : String(n); }

          function toDateStr(d) {
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
          }

          function timeToMins(t) {
            var parts = (t || '00:00').split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
          }

          function minsToStr(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }

          function isExcludedIntervalSlot(dateStr, timeStr, cfg) {
            var excluded = (cfg && cfg.excludedSlots) || [];
            for (var ei = 0; ei < excluded.length; ei++) {
              if (excluded[ei] && excluded[ei].date === dateStr && excluded[ei].startTime === timeStr) {
                return true;
              }
            }
            return false;
          }

          function slotKey(slot) {
            if (slot && slot.id) return String(slot.id);
            if (!slot) return '';
            return String(slot.date || '') + 'T' + String(slot.startTime || '');
          }

          function slotCapacity(slot, cfg) {
            var cap = Number(slot && slot.maxBookings);
            if (isFinite(cap) && cap > 0) return cap;
            if ((slot && slot.sessionType) === 'group') {
              var groupCap = Number(cfg && cfg.groupMaxAttendees);
              return (isFinite(groupCap) && groupCap > 0) ? groupCap : 1;
            }
            return 1;
          }

          // Capacity for auto-generated interval slots
          function intervalSlotCapacity(cfg) {
            var n = Number(cfg && cfg.maxBookingsPerSlot);
            if (isFinite(n) && n > 0) return n;
            if ((cfg && cfg.appointmentType) === 'group') {
              var g = Number(cfg && cfg.groupMaxAttendees);
              return (isFinite(g) && g > 0) ? g : 10;
            }
            return 1;
          }

          function fetchBookingSnapshot(fieldName, slotKeys, datePrefix) {
            var safeKeys = (slotKeys || []).filter(Boolean);
            var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            var timer = controller ? setTimeout(function() { controller.abort(); }, 6000) : null;
            return fetch(APPT_COUNTS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                formId: APPT_FORM_ID,
                fieldName: fieldName,
                slotKeys: safeKeys,
                datePrefix: datePrefix || '',
              }),
              signal: controller ? controller.signal : undefined,
            }).then(function(response) {
              if (timer) clearTimeout(timer);
              if (!response.ok) {
                return response.text().then(function(body) {
                  throw new Error(body || ('Appointment count check failed (' + response.status + ')'));
                });
              }
              return response.json();
            }).catch(function(err) {
              if (timer) clearTimeout(timer);
              console.warn('Appointment availability check failed:', err);
              return { countsBySlot: {}, dayBookingCount: 0 };
            });
          }

          function formatDisplayDate(d, fmt) {
            var y = d.getFullYear();
            var mo = pad(d.getMonth() + 1);
            var dy = pad(d.getDate());
            if (fmt === 'DD/MM/YYYY') return dy + '/' + mo + '/' + y;
            if (fmt === 'YYYY/MM/DD') return y + '/' + mo + '/' + dy;
            return mo + '/' + dy + '/' + y;
          }

          function formatTime(minsTotal, use12h) {
            var h = Math.floor(minsTotal / 60);
            var m = minsTotal % 60;
            if (use12h) {
              var ampm = h >= 12 ? 'PM' : 'AM';
              var h12 = h % 12 || 12;
              return h12 + ':' + pad(m) + ' ' + ampm;
            }
            return pad(h) + ':' + pad(m);
          }

          function dayMatchesInterval(days, dow) {
            // dow: 0=Sun...6=Sat (JS default)
            var map = {
              'Every Day': [0,1,2,3,4,5,6],
              'Weekdays':  [1,2,3,4,5],
              'Weekends':  [0,6],
              'Mon': [1], 'Monday':    [1],
              'Tue': [2], 'Tuesday':   [2],
              'Wed': [3], 'Wednesday': [3],
              'Thu': [4], 'Thursday':  [4],
              'Fri': [5], 'Friday':    [5],
              'Sat': [6], 'Saturday':  [6],
              'Sun': [0], 'Sunday':    [0],
            };
            return (map[days] || []).indexOf(dow) !== -1;
          }

          function isDateAvailable(d, cfg) {
            var today = new Date();
            var todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (d < todayMid) return false;

            // Minimum scheduling notice
            if (cfg.minSchedulingNoticeHours || cfg.minSchedulingNoticeMinutes) {
              var noticeMs = ((cfg.minSchedulingNoticeHours || 0) * 60 + (cfg.minSchedulingNoticeMinutes || 0)) * 60000;
              var earliest = new Date(Date.now() + noticeMs);
              var dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
              if (dEnd < earliest) return false;
            }

            if (cfg.rollingDays) {
              var maxD = new Date(todayMid);
              maxD.setDate(todayMid.getDate() + cfg.rollingDays);
              if (d > maxD) return false;
            }
            if (cfg.bookingStartDate) {
              var sd = new Date(cfg.bookingStartDate + 'T00:00:00');
              if (d < sd) return false;
            }
            if (cfg.bookingEndDate) {
              var ed = new Date(cfg.bookingEndDate + 'T23:59:59');
              if (d > ed) return false;
            }

            var ds = toDateStr(d);
            var vacs = cfg.vacations || [];
            for (var vi = 0; vi < vacs.length; vi++) {
              if (ds >= vacs[vi].startDate && ds <= (vacs[vi].endDate || vacs[vi].startDate)) return false;
            }

            var slots = cfg.slots || [];
            for (var si = 0; si < slots.length; si++) {
              if (slots[si].date === ds) return true;
            }
            return getSlotsForDate(d, cfg).length > 0;
          }

          function getSlotsForDate(d, cfg) {
            var dow = d.getDay();
            var ds  = toDateStr(d);
            var duration = cfg.slotDuration === 'custom'
              ? (cfg.customSlotDuration || 30)
              : (cfg.slotDuration || 60);
            var buffer = Number(cfg.bufferMinutes) || 0;
            var step   = duration + buffer;       // total minutes consumed per slot
            var lunchFrom = cfg.lunchtimeEnabled ? timeToMins(cfg.lunchtimeFrom || '12:00') : -1;
            var lunchTo   = cfg.lunchtimeEnabled ? timeToMins(cfg.lunchtimeTo   || '13:00') : -1;

            // Minimum notice cutoff (minutes from midnight today)
            var noticeMins = 0;
            var today = new Date();
            var isToday = ds === toDateStr(today);
            if (isToday && (cfg.minSchedulingNoticeHours || cfg.minSchedulingNoticeMinutes)) {
              var now = new Date();
              noticeMins = (now.getHours() * 60 + now.getMinutes()) +
                ((cfg.minSchedulingNoticeHours || 0) * 60 + (cfg.minSchedulingNoticeMinutes || 0));
            }

            var slots = [];
            var intervals = cfg.intervals || [];
            for (var ii = 0; ii < intervals.length; ii++) {
              var interval = intervals[ii];
              // Match by specificDate OR by day-of-week pattern
              if (interval.specificDate) {
                if (interval.specificDate !== ds) continue;
              } else {
                if (!dayMatchesInterval(interval.days, dow)) continue;
              }
              var startMins = timeToMins(interval.from);
              var endMins   = timeToMins(interval.to);
              while (startMins + duration <= endMins) {
                // Skip past notice cutoff
                if (isToday && startMins < noticeMins) { startMins += step; continue; }
                // Skip lunchtime overlap
                if (lunchFrom >= 0) {
                  var slotEnd = startMins + duration;
                  if (startMins < lunchTo && slotEnd > lunchFrom) {
                    startMins = lunchTo;
                    continue;
                  }
                }
                var slotTime = minsToStr(startMins);
                if (!isExcludedIntervalSlot(ds, slotTime, cfg)) {
                  slots.push(startMins);
                }
                startMins += step;
              }
            }
            // Deduplicate & sort
            var seen = {};
            var result = [];
            for (var si = 0; si < slots.length; si++) {
              if (!seen[slots[si]]) { seen[slots[si]] = true; result.push(slots[si]); }
            }
            result.sort(function(a, b) { return a - b; });
            return result;
          }

          function getManualSlotsForDate(d, cfg) {
            var ds = toDateStr(d);
            var all = cfg.slots || [];
            var noticeMins = 0;
            var today = new Date();
            var isToday = ds === toDateStr(today);
            if (isToday && (cfg.minSchedulingNoticeHours || cfg.minSchedulingNoticeMinutes)) {
              noticeMins = (today.getHours() * 60 + today.getMinutes()) +
                ((cfg.minSchedulingNoticeHours || 0) * 60 + (cfg.minSchedulingNoticeMinutes || 0));
            }
            var result = all.filter(function(slot) {
              if (!slot || slot.date !== ds) return false;
              if (isToday) {
                var mins = timeToMins(slot.startTime || '00:00');
                if (mins < noticeMins) return false;
              }
              return true;
            });
            result.sort(function(a, b) {
              return timeToMins(a.startTime || '00:00') - timeToMins(b.startTime || '00:00');
            });
            return result;
          }

          function getTzOffset(tz) {
            try {
              var now = new Date();
              var fmt = new Intl.DateTimeFormat('en-US', {
                timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
              });
              var parts = fmt.formatToParts(now);
              var h = 0, m = 0;
              parts.forEach(function(p) {
                if (p.type === 'hour')   h = parseInt(p.value, 10);
                if (p.type === 'minute') m = parseInt(p.value, 10);
              });
              return h < 10 ? '0' + h + ':' + (m < 10 ? '0' + m : m) : h + ':' + (m < 10 ? '0' + m : m);
            } catch (e) { return ''; }
          }

          function bindApptWidget(wrap) {
            var cfg = {};
            try { cfg = JSON.parse(wrap.dataset.apptConfig || '{}'); } catch(e) {}
            var hidden = wrap.querySelector('input[type="hidden"]');
            if (!hidden) return;

            var dateInput  = wrap.querySelector('.appt-date-input');
            var dayLabel   = wrap.querySelector('.appt-selected-day-label');
            var detailCard = wrap.querySelector('.appt-slot-detail');
            var slotsGrid  = wrap.querySelector('.appt-time-slots-grid');
            var dayHdrs    = wrap.querySelector('.appt-day-headers');
            var daysGrid   = wrap.querySelector('.appt-days-grid');
            var monthSel   = wrap.querySelector('.appt-month-sel');
            var yearSel    = wrap.querySelector('.appt-year-sel');
            var monthPrev  = wrap.querySelector('.appt-month-prev');
            var monthNext  = wrap.querySelector('.appt-month-next');
            var yearPrev   = wrap.querySelector('.appt-year-prev');
            var yearNext   = wrap.querySelector('.appt-year-next');
            var prevDayBtn = wrap.querySelector('.appt-prev-day');
            var nextDayBtn = wrap.querySelector('.appt-next-day');
            var tzLabel    = wrap.querySelector('.appt-tz-label');
            var tzOffset   = wrap.querySelector('.appt-tz-offset');

            var today = new Date();
            var viewYear  = today.getFullYear();
            var viewMonth = today.getMonth(); // 0-based
            var selectedDate = null;

            var fmt      = cfg.dateFormat || 'MM/DD/YYYY';
            var use12h   = (cfg.timeFormat || '12h') === '12h';
            var startMon = cfg.startWeekOn === 'monday';
            var tz       = cfg.defaultTimezone || cfg.timezone || '';
            var fieldName = wrap.dataset.fieldName || wrap.dataset.fieldId || 'appointment';
            var slotRenderNonce = 0;
            var selectedSlotDetailKey = '';

            function setSlotDetail(title, meta, key) {
              if (!detailCard) return;
              var titleEl = detailCard.querySelector('.appt-slot-detail-title');
              var metaEl = detailCard.querySelector('.appt-slot-detail-meta');
              if (titleEl) titleEl.textContent = title || 'Choose a time slot';
              if (metaEl) metaEl.textContent = meta || 'Hover or tap a slot to view class, teacher, and duration details.';
              if (key) selectedSlotDetailKey = key;
            }

            function bindSlotDetail(btn, title, meta, key) {
              btn.addEventListener('mouseenter', function() { setSlotDetail(title, meta); });
              btn.addEventListener('focus', function() { setSlotDetail(title, meta); });
              btn.addEventListener('click', function() { setSlotDetail(title, meta, key); });
              btn.addEventListener('mouseleave', function() {
                if (!selectedSlotDetailKey || selectedSlotDetailKey !== key) return;
                setSlotDetail(title, meta, key);
              });
            }

            // Populate month select
            if (monthSel) {
              MONTHS.forEach(function(mn, idx) {
                var opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = mn;
                monthSel.appendChild(opt);
              });
              monthSel.value = viewMonth;
              monthSel.addEventListener('change', function() {
                viewMonth = parseInt(this.value, 10);
                renderCalendar();
              });
            }

            // Populate year select
            if (yearSel) {
              var minY = today.getFullYear();
              var maxY = today.getFullYear() + 3;
              for (var y = minY; y <= maxY; y++) {
                var yOpt = document.createElement('option');
                yOpt.value = y;
                yOpt.textContent = y;
                yearSel.appendChild(yOpt);
              }
              yearSel.value = viewYear;
              yearSel.addEventListener('change', function() {
                viewYear = parseInt(this.value, 10);
                renderCalendar();
              });
            }

            function changeMonth(delta) {
              viewMonth += delta;
              if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
              if (viewMonth > 11) { viewMonth = 0;  viewYear++; }
              if (monthSel) monthSel.value = viewMonth;
              if (yearSel)  yearSel.value  = viewYear;
              renderCalendar();
            }

            if (monthPrev) monthPrev.addEventListener('click', function() { changeMonth(-1); });
            if (monthNext) monthNext.addEventListener('click', function() { changeMonth(1); });
            if (yearPrev)  yearPrev.addEventListener('click', function() { viewYear--; if (yearSel) yearSel.value = viewYear; renderCalendar(); });
            if (yearNext)  yearNext.addEventListener('click', function() { viewYear++; if (yearSel) yearSel.value = viewYear; renderCalendar(); });

            // Day headers
            if (dayHdrs) {
              var hdrs = startMon ? DAYS_SHORT_MON : DAYS_SHORT_SUN;
              hdrs.forEach(function(h) {
                var span = document.createElement('div');
                span.className = 'appt-day-hdr';
                span.textContent = h;
                dayHdrs.appendChild(span);
              });
            }

            function renderCalendar() {
              if (!daysGrid) return;
              daysGrid.innerHTML = '';

              var firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
              // Adjust for Monday start
              var offset = startMon ? ((firstDay + 6) % 7) : firstDay;

              var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
              var prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

              // Leading empty cells from prev month
              for (var p = offset - 1; p >= 0; p--) {
                var cell = document.createElement('div');
                cell.className = 'appt-day-cell appt-day-other-month';
                cell.textContent = prevMonthDays - p;
                daysGrid.appendChild(cell);
              }

              var todayStr = toDateStr(today);
              var selStr   = selectedDate ? toDateStr(selectedDate) : '';

              for (var day = 1; day <= daysInMonth; day++) {
                var d = new Date(viewYear, viewMonth, day);
                var dStr = toDateStr(d);
                var isAvail = isDateAvailable(d, cfg);

                var cell = document.createElement('div');
                cell.textContent = day;
                var classes = 'appt-day-cell';
                if (!isAvail)      classes += ' appt-day-disabled';
                if (dStr === todayStr && dStr === selStr) classes += ' appt-day-today-sel';
                else if (dStr === todayStr)  classes += ' appt-day-today';
                else if (dStr === selStr)    classes += ' appt-day-selected';
                cell.className = classes;

                if (isAvail) {
                  (function(date) {
                    cell.addEventListener('click', function() { selectDate(date); });
                  })(d);
                }
                daysGrid.appendChild(cell);
              }
            }

            function selectDate(d) {
              selectedDate = d;
              wrap.dataset.selectedSlotKey = '';
              hidden.value = '';
              renderCalendar();
              renderSlots();
              if (dateInput) dateInput.value = formatDisplayDate(d, fmt);

              // Navigate to selected date's month if needed
              if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) {
                viewYear  = d.getFullYear();
                viewMonth = d.getMonth();
                if (monthSel) monthSel.value = viewMonth;
                if (yearSel)  yearSel.value  = viewYear;
                renderCalendar();
              }
            }

            function renderSlots() {
              if (!slotsGrid || !selectedDate) return;
              var renderNonce = ++slotRenderNonce;
              slotsGrid.innerHTML = '';
              selectedSlotDetailKey = '';
              setSlotDetail('', '');

              var fullLabel = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: '2-digit'
              });
              if (dayLabel) dayLabel.textContent = fullLabel;

              var manualSlots   = getManualSlotsForDate(selectedDate, cfg);
              var intervalMins  = getSlotsForDate(selectedDate, cfg);

              // Deduplicate interval times that are already covered by a manual slot
              var manualTimes = {};
              manualSlots.forEach(function(s) { manualTimes[timeToMins(s.startTime || '00:00')] = true; });
              var filteredIntervalMins = intervalMins.filter(function(m) { return !manualTimes[m]; });

              if (!manualSlots.length && !filteredIntervalMins.length) {
                var msg = document.createElement('div');
                msg.className = 'appt-no-slots';
                msg.textContent = 'No available slots for this day.';
                slotsGrid.appendChild(msg);
                if (prevDayBtn) prevDayBtn.disabled = false;
                if (nextDayBtn) nextDayBtn.disabled = false;
                return;
              }

              // Build a unified list sorted by start time
              var unified = [];
              manualSlots.forEach(function(slot) {
                unified.push({ mins: timeToMins(slot.startTime || '00:00'), type: 'manual', slot: slot });
              });
              filteredIntervalMins.forEach(function(mins) {
                unified.push({ mins: mins, type: 'interval', slot: null });
              });
              unified.sort(function(a, b) { return a.mins - b.mins; });

              var slotKeys = unified.map(function(entry) {
                return entry.type === 'manual'
                  ? slotKey(entry.slot)
                  : (toDateStr(selectedDate) + 'T' + minsToStr(entry.mins));
              });
              var intervalCap = intervalSlotCapacity(cfg);
              var datePrefix = toDateStr(selectedDate);
              var maxPerDay = Number(cfg.maxAppointmentsPerDay || 0);

              slotsGrid.innerHTML = '<div class="appt-no-slots">Loading available slots...</div>';
              fetchBookingSnapshot(fieldName, slotKeys, datePrefix).then(function(snapshot) {
                if (renderNonce !== slotRenderNonce) return;
                slotsGrid.innerHTML = '';

                var bookingMap = snapshot && snapshot.countsBySlot ? snapshot.countsBySlot : {};
                var dayBookingCount = Number(snapshot && snapshot.dayBookingCount || 0);
                if (maxPerDay > 0 && dayBookingCount >= maxPerDay) {
                  var fullDay = document.createElement('div');
                  fullDay.className = 'appt-no-slots';
                  fullDay.textContent = 'Daily booking limit reached for this date.';
                  slotsGrid.appendChild(fullDay);
                  return;
                }

                unified.forEach(function(entry) {
                  var btn = document.createElement('button');
                  btn.type = 'button';
                  btn.className = 'appt-time-btn';

                  if (entry.type === 'manual') {
                    var slot = entry.slot;
                    var key  = slotKey(slot);
                    var cap  = slotCapacity(slot, cfg);
                    var booked = Number(bookingMap[key] || 0);
                    var remaining = Math.max(0, cap - booked);
                    btn.dataset.slotKey = key;
                    btn.dataset.slotCap = String(cap);
                    var manualLabel = remaining === 1 ? '1 slot left' : remaining + ' slots left';
                    btn.innerHTML = '<span class="appt-time-btn-time">' + formatTime(entry.mins, use12h) + '</span>' +
                      '<span class="appt-time-btn-meta">' + manualLabel + '</span>';
                    var manualMeta = (slot.className || 'Session') +
                      ' · ' + (slot.teacherName || 'Instructor') +
                      ' · ' + (slot.sessionType === 'group' ? 'Group' : 'Personal') +
                      ' · ' + String(slot.durationMinutes || cfg.customSlotDuration || cfg.slotDuration || 30) + ' min';
                    bindSlotDetail(btn, formatTime(entry.mins, use12h), manualMeta, key);
                    if (remaining <= 0) {
                      btn.disabled = true;
                      btn.classList.add('appt-time-btn-full');
                    } else {
                      btn.addEventListener('click', function() {
                        slotsGrid.querySelectorAll('.appt-time-btn').forEach(function(b) { b.classList.remove('selected'); });
                        btn.classList.add('selected');
                        hidden.value = toDateStr(selectedDate) + 'T' + (slot.startTime || '00:00');
                        wrap.dataset.selectedSlotKey = key;
                        hidden.dispatchEvent(new Event('change', { bubbles: true }));
                      });
                    }
                  } else {
                    var iKey = toDateStr(selectedDate) + 'T' + minsToStr(entry.mins);
                    var iBooked = Number(bookingMap[iKey] || 0);
                    var iRemaining = Math.max(0, intervalCap - iBooked);
                    btn.dataset.slotKey = iKey;
                    var intervalLabel = iRemaining === 1 ? '1 slot left' : iRemaining + ' slots left';
                    btn.innerHTML = '<span class="appt-time-btn-time">' + formatTime(entry.mins, use12h) + '</span>' +
                      '<span class="appt-time-btn-meta">' + intervalLabel + '</span>';
                    var intervalMeta = 'Standard appointment' +
                      ' · ' + String(cfg.appointmentType === 'group' ? 'Group' : 'Personal') +
                      ' · ' + String(cfg.slotDuration === 'custom' ? (cfg.customSlotDuration || 30) : (cfg.slotDuration || 60)) + ' min';
                    bindSlotDetail(btn, formatTime(entry.mins, use12h), intervalMeta, iKey);
                    if (iRemaining <= 0) {
                      btn.disabled = true;
                      btn.classList.add('appt-time-btn-full');
                    } else {
                      btn.addEventListener('click', function() {
                        slotsGrid.querySelectorAll('.appt-time-btn').forEach(function(b) { b.classList.remove('selected'); });
                        btn.classList.add('selected');
                        hidden.value = iKey;
                        wrap.dataset.selectedSlotKey = iKey;
                        hidden.dispatchEvent(new Event('change', { bubbles: true }));
                      });
                    }
                  }
                  slotsGrid.appendChild(btn);
                });

                if (prevDayBtn) prevDayBtn.disabled = false;
                if (nextDayBtn) nextDayBtn.disabled = false;
              });
            }

            // Prev/Next day navigation
            function navDay(delta) {
              if (!selectedDate) {
                selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              } else {
                selectedDate = new Date(selectedDate.getTime() + delta * 86400000);
              }
              wrap.dataset.selectedSlotKey = '';
              hidden.value = '';
              // Sync calendar to the selected date's month
              viewYear  = selectedDate.getFullYear();
              viewMonth = selectedDate.getMonth();
              if (monthSel) monthSel.value = viewMonth;
              if (yearSel)  yearSel.value  = viewYear;
              renderCalendar();
              renderSlots();
              if (dateInput) dateInput.value = formatDisplayDate(selectedDate, fmt);
            }
            if (prevDayBtn) prevDayBtn.addEventListener('click', function() { navDay(-1); });
            if (nextDayBtn) nextDayBtn.addEventListener('click', function() { navDay(1); });

            // Timezone display
            if (tz && tzLabel) {
              tzLabel.textContent = tz;
              if (tzOffset) tzOffset.textContent = '(' + getTzOffset(tz) + ')';
            }

            // Initial render
            renderCalendar();
          }

          window.__validateAppointmentBooking = function(formEl) {
            var root = formEl || document;
            var groups = Array.prototype.slice.call(root.querySelectorAll('[data-appt="true"]'));
            if (!groups.length) return Promise.resolve({ ok: true });

            var chain = Promise.resolve({ ok: true });
            groups.forEach(function(group) {
              chain = chain.then(function(result) {
                if (!result.ok) return result;
                // Services-mode widgets are validated separately above — skip here
                if (group.dataset.apptMode === 'services') return result;

                var hidden = group.querySelector('input[type="hidden"]');
                if (hidden && hidden.required && !hidden.value) {
                  var missingLabel = group.querySelector('.appt-selected-day-label');
                  if (missingLabel) missingLabel.textContent = 'Please select a date and time.';
                  return { ok: false, message: 'Please select a date and time.' };
                }

                var selectedKey = group.dataset.selectedSlotKey || '';
                if (!selectedKey || !hidden || !hidden.value) return { ok: true };

                var apptCfg = {};
                try { apptCfg = JSON.parse(group.dataset.apptConfig || '{}'); } catch (err) {}
                var selectedSlot = null;
                if (apptCfg.slots && apptCfg.slots.length) {
                  for (var si = 0; si < apptCfg.slots.length; si++) {
                    if (slotKey(apptCfg.slots[si]) === selectedKey) {
                      selectedSlot = apptCfg.slots[si];
                      break;
                    }
                  }
                }

                var capacity = selectedSlot ? slotCapacity(selectedSlot, apptCfg) : intervalSlotCapacity(apptCfg);
                var datePrefix = String(hidden.value).split('T')[0] || '';
                var maxPerDay = Number(apptCfg.maxAppointmentsPerDay || 0);
                var fieldName = group.dataset.fieldName || group.dataset.fieldId || 'appointment';

                return fetchBookingSnapshot(fieldName, [selectedKey], datePrefix).then(function(snapshot) {
                  var counts = snapshot && snapshot.countsBySlot ? snapshot.countsBySlot : {};
                  var booked = Number(counts[selectedKey] || 0);
                  var dayBookingCount = Number(snapshot && snapshot.dayBookingCount || 0);

                  if (booked >= capacity) {
                    var fullLabel = group.querySelector('.appt-selected-day-label');
                    if (fullLabel) fullLabel.textContent = 'Selected slot is fully booked. Pick another slot.';
                    return { ok: false, message: 'Selected slot is fully booked. Pick another slot.' };
                  }
                  if (maxPerDay > 0 && dayBookingCount >= maxPerDay) {
                    var dayLabel2 = group.querySelector('.appt-selected-day-label');
                    if (dayLabel2) dayLabel2.textContent = 'Daily booking limit reached for this date.';
                    return { ok: false, message: 'Daily booking limit reached for this date.' };
                  }
                  return { ok: true };
                });
              });
            });
            return chain;
          };

          // ── Services-mode widget ─────────────────────────────────────────────
          function bindServicesWidget(wrap) {
            var cfg = {};
            try { cfg = JSON.parse(wrap.dataset.apptConfig || '{}'); } catch(e) {}
            var hidden = wrap.querySelector('input[type="hidden"]');
            if (!hidden) return;
            var services  = cfg.services  || [];
            var availDates = cfg.availableDates || [];
            var use12h = (cfg.timeFormat || '12h') === '12h';
            var hideFullSlots = cfg.hideFullSlots === true;
            var fieldName = wrap.dataset.fieldName || wrap.dataset.fieldId || 'appointment';
            var summary = wrap.querySelector('.appt-svc-selection-summary');

            // ── slot generation ──────────────────────────────────────────────
            function genSlots(svc, dateEntry) {
              var duration = Number(svc.durationMinutes) || 30;
              var buffer   = Number(svc.bufferMinutes)   || 0;
              var step     = duration + buffer;
              var start    = timeToMins(dateEntry.from);
              var end      = timeToMins(dateEntry.to);
              var slots    = [];
              while (start + duration <= end) {
                slots.push(minsToStr(start));
                start += step;
              }
              return slots;
            }

            // ── service tab switching ────────────────────────────────────────
            var tabs   = Array.prototype.slice.call(wrap.querySelectorAll('.appt-svc-tab'));
            var panels = Array.prototype.slice.call(wrap.querySelectorAll('.appt-svc-panel'));
            tabs.forEach(function(tab, idx) {
              tab.addEventListener('click', function() {
                tabs.forEach(function(t) { t.classList.remove('active'); });
                panels.forEach(function(p) { p.classList.remove('active'); p.hidden = true; });
                tab.classList.add('active');
                if (panels[idx]) { panels[idx].classList.add('active'); panels[idx].hidden = false; }
              });
            });

            // ── render slots for one date group ─────────────────────────────
            function renderDateGroup(group, svc) {
              var dateStr   = group.dataset.date;
              var slotsRow  = group.querySelector('.appt-svc-slots-row');
              if (!slotsRow) return;
              var times = genSlots(svc, { from: '', to: '' });
              // find the correct availDate entry
              var dateEntry = null;
              for (var di = 0; di < availDates.length; di++) {
                if (availDates[di].date === dateStr) { dateEntry = availDates[di]; break; }
              }
              if (!dateEntry) { slotsRow.innerHTML = '<div class="appt-no-slots">No time window configured.</div>'; return; }
              times = genSlots(svc, dateEntry);
              if (!times.length) { slotsRow.innerHTML = '<div class="appt-no-slots">No slots in this window.</div>'; return; }

              var slotKeys = times.map(function(t) { return svc.id + '::' + dateStr + 'T' + t; });
              var cap = Number(svc.maxBookingsPerSlot) || 1;

              // ── Build slot button helper ──────────────────────────────────
              function buildSlotBtn(t, ti, booked) {
                var key = slotKeys[ti];
                var remaining = Math.max(0, cap - booked);
                if (remaining <= 0 && hideFullSlots) return null; // hide fully booked
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.slotKey = key;
                btn.dataset.slotTime = t;
                btn.className = 'appt-svc-slot-btn';
                var timeLabel = formatTime(timeToMins(t), use12h);
                var remLabel  = cap > 1 ? (remaining === 1 ? ' · 1 left' : remaining > 0 ? ' · ' + remaining + ' left' : '') : '';
                btn.innerHTML = '<span class="appt-svc-slot-time">' + timeLabel + '</span>' +
                  (cap > 1 && remaining > 0 ? '<span class="appt-svc-slot-rem">' + remLabel + '</span>' : '');

                if (remaining <= 0) {
                  btn.disabled = true;
                  btn.classList.add('appt-svc-slot-full');
                  btn.innerHTML += '<span class="appt-svc-slot-badge appt-badge-full">Full</span>';
                } else {
                  btn.addEventListener('click', function() {
                    wrap.querySelectorAll('.appt-svc-slot-btn.selected').forEach(function(b) { b.classList.remove('selected'); });
                    btn.classList.add('selected');
                    hidden.value = key;
                    hidden.dispatchEvent(new Event('change', { bubbles: true }));
                    if (summary) {
                      summary.textContent = (svc.name ? svc.name : 'Appointment') +
                        (svc.with ? ' with ' + svc.with : '') +
                        ' on ' + dateStr + ' at ' + timeLabel +
                        ' (' + (svc.durationMinutes || 30) + ' min)';
                    }
                  });
                }
                return btn;
              }

              // ── Render all slots immediately as available ─────────────────
              slotsRow.innerHTML = '';
              times.forEach(function(t, ti) {
                var btn = buildSlotBtn(t, ti, 0);
                if (btn) slotsRow.appendChild(btn);
              });

              // ── Async update with real booking counts ─────────────────────
              fetchBookingSnapshot(fieldName, slotKeys, '').then(function(snapshot) {
                var counts = snapshot && snapshot.countsBySlot ? snapshot.countsBySlot : {};
                var hasChanges = false;
                for (var ki = 0; ki < slotKeys.length; ki++) {
                  if (Number(counts[slotKeys[ki]] || 0) > 0) { hasChanges = true; break; }
                }
                if (!hasChanges) return; // no bookings yet, slots are already showing as fully available
                // Re-render with real counts
                var prevSelected = hidden.value;
                slotsRow.innerHTML = '';
                times.forEach(function(t, ti) {
                  var booked = Number(counts[slotKeys[ti]] || 0);
                  var btn = buildSlotBtn(t, ti, booked);
                  if (!btn) return; // hidden because full + hideFullSlots
                  if (prevSelected === slotKeys[ti] && !btn.disabled) btn.classList.add('selected');
                  slotsRow.appendChild(btn);
                });
              });
            }

            // ── initial render ───────────────────────────────────────────────
            panels.forEach(function(panel, svcIdx) {
              var svc = services[svcIdx];
              if (!svc) return;
              var groups = Array.prototype.slice.call(panel.querySelectorAll('.appt-svc-date-group'));
              groups.forEach(function(group) { renderDateGroup(group, svc); });
            });
          }

          // ── Validation for services mode ─────────────────────────────────────
          var _origValidate = window.__validateAppointmentBooking;
          window.__validateAppointmentBooking = function(formEl) {
            var root = formEl || document;
            // Services-mode widgets
            var svcWidgets = Array.prototype.slice.call(root.querySelectorAll('[data-appt-mode="services"]'));
            var svcChain = Promise.resolve({ ok: true });
            svcWidgets.forEach(function(wrap) {
              svcChain = svcChain.then(function(prev) {
                if (!prev.ok) return prev;
                var hidden = wrap.querySelector('input[type="hidden"]');
                if (hidden && hidden.required && !hidden.value) {
                  var sum = wrap.querySelector('.appt-svc-selection-summary');
                  if (sum) sum.textContent = 'Please select an appointment slot.';
                  return { ok: false, message: 'Please select an appointment slot.' };
                }
                if (!hidden || !hidden.value) return { ok: true };
                // In services mode, hidden.value IS the slotKey (e.g. "svc1::2026-03-14T12:00")
                var slotKey2 = hidden.value;
                if (!slotKey2) return { ok: true };
                // Determine capacity: find the matching service
                var cfg2 = {};
                try { cfg2 = JSON.parse(wrap.dataset.apptConfig || '{}'); } catch(e) {}
                var svcId2 = slotKey2.split('::')[0] || '';
                var svc2 = null;
                var svcs = cfg2.services || [];
                for (var si = 0; si < svcs.length; si++) {
                  if (svcs[si].id === svcId2) { svc2 = svcs[si]; break; }
                }
                var cap2 = svc2 ? (Number(svc2.maxBookingsPerSlot) || 1) : 1;
                var fn2 = wrap.dataset.fieldName || wrap.dataset.fieldId || 'appointment';
                return fetchBookingSnapshot(fn2, [slotKey2], '').then(function(snap) {
                  var booked2 = Number(snap && snap.countsBySlot ? (snap.countsBySlot[slotKey2] || 0) : 0);
                  if (booked2 >= cap2) {
                    var sum2 = wrap.querySelector('.appt-svc-selection-summary');
                    if (sum2) sum2.textContent = 'Selected slot is now fully booked. Please pick another.';
                    return { ok: false, message: 'Selected slot is now fully booked. Please pick another.' };
                  }
                  return { ok: true };
                });
              });
            });
            // Then run legacy validation
            return svcChain.then(function(r) {
              if (!r.ok) return r;
              return _origValidate(formEl);
            });
          };

          document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('[data-appt="true"]').forEach(function(wrap) {
              if (wrap.dataset.apptMode === 'services') {
                bindServicesWidget(wrap);
              } else {
                bindApptWidget(wrap);
              }
            });
          });
        })();`;
}

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
  const splitLayouts = ['split-left', 'split-right', 'editorial-left', 'editorial-right'];
  const bannerLayouts = ['banner-top', 'showcase-banner'];
  const defaultHeroHeight =
    bannerLayouts.includes(layout)
      ? layout === 'showcase-banner' ? 420 : 260
      : splitLayouts.includes(layout)
        ? 760
        : 420;
  const initialHero = getHeroForPage(config, 0, { defaultHeight: defaultHeroHeight });
  const { size: bgSize, repeat: bgRepeat } = resolveHeroBackgroundStyle(config.layoutImageFit, initialHero?.zoom ?? 100);
  const imgSrc = initialHero?.url ? `url('${initialHero.url}')` : 'none';
  const posX = initialHero?.cropX ?? (config.layoutImagePositionX ?? '50');
  const posY = initialHero?.cropY ?? (config.layoutImagePositionY ?? '50');
  const heroHeight = initialHero?.height ?? defaultHeroHeight;
  const imgPanelW = config.layoutImagePanelWidth ?? 45;
  const formPanelW = 100 - imgPanelW;

  const base = `
        /* ── Layout: ${layout} ── */
        body.layout-card .form-container {
            box-shadow: 0 32px 64px -12px rgba(0,0,0,0.28), 0 16px 32px -8px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04);
        }
        body.layout-split-left, body.layout-split-right, body.layout-editorial-left, body.layout-editorial-right {
            padding: 0;
            align-items: stretch;
            justify-content: flex-start;
            min-height: 100vh;
        }
        body.layout-split-left, body.layout-editorial-left { flex-direction: row; }
        body.layout-split-right, body.layout-editorial-right { flex-direction: row-reverse; }
        .layout-image-panel {
            flex: 0 0 ${imgPanelW}%;
            min-height: ${heroHeight}px;
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
            min-height: ${heroHeight}px;
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
        body.layout-split-right .form-container,
        body.layout-editorial-left .form-container,
        body.layout-editorial-right .form-container {
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border-radius: 0;
            background: transparent;
            animation: none;
            flex-shrink: 0;
            min-height: 100%;
            display: flex;
            flex-direction: column;
        }
        body.layout-split-left .form-container::before,
        body.layout-split-right .form-container::before,
        body.layout-editorial-left .form-container::before,
        body.layout-editorial-right .form-container::before {
            display: none;
        }
        /* Remove inner horizontal padding — outer panel padding is enough */
        body.layout-split-left .logo-container,
        body.layout-split-right .logo-container,
        body.layout-editorial-left .logo-container,
        body.layout-editorial-right .logo-container,
        body.layout-split-left .form-header,
        body.layout-split-right .form-header,
        body.layout-editorial-left .form-header,
        body.layout-editorial-right .form-header,
        body.layout-split-left .form-body,
        body.layout-split-right .form-body,
        body.layout-editorial-left .form-body,
        body.layout-editorial-right .form-body {
            padding-left: 0;
            padding-right: 0;
        }
        body.layout-split-left .form-body,
        body.layout-split-right .form-body,
        body.layout-editorial-left .form-body,
        body.layout-editorial-right .form-body {
            flex: 1;
        }
        body.layout-editorial-left,
        body.layout-editorial-right {
            background:
              radial-gradient(circle at top, rgba(15,23,42,0.08), transparent 45%),
              linear-gradient(180deg, #f8fafc, #e2e8f0);
            padding: 24px;
        }
        body.layout-editorial-left .layout-image-panel,
        body.layout-editorial-right .layout-image-panel {
            border-radius: 28px 0 0 28px;
        }
        body.layout-editorial-right .layout-image-panel {
            border-radius: 0 28px 28px 0;
        }
        body.layout-editorial-left .layout-image-overlay,
        body.layout-editorial-right .layout-image-overlay {
            display: block;
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.28));
        }
        body.layout-editorial-left .layout-form-panel,
        body.layout-editorial-right .layout-form-panel {
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96));
            padding: 72px 76px;
            border-radius: 0 28px 28px 0;
            box-shadow: 0 32px 80px rgba(15,23,42,0.12);
        }
        body.layout-editorial-right .layout-form-panel {
            border-radius: 28px 0 0 28px;
        }
        body.layout-banner-top,
        body.layout-showcase-banner {
            flex-direction: column;
            align-items: center;
            padding: 0;
            background: var(--bg-primary);
        }
        .layout-banner {
            width: 100%;
            height: ${heroHeight}px;
            flex-shrink: 0;
            background-color: #6366f1;
            background-image: ${imgSrc !== 'none' ? imgSrc : 'var(--primary-gradient)'};
            background-size: ${bgSize};
            background-position: ${posX}% ${posY}%;
            background-repeat: ${bgRepeat};
            position: relative;
        }
        body.layout-showcase-banner .layout-banner::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.45));
        }
        body.layout-banner-top .form-container,
        body.layout-showcase-banner .form-container {
            margin-top: -48px;
            margin-bottom: 32px;
            position: relative;
            z-index: 1;
        }
        body.layout-showcase-banner .form-container {
            margin-top: -110px;
            width: min(920px, calc(100vw - 64px));
            box-shadow: 0 28px 80px rgba(15,23,42,0.18);
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
            body.layout-split-left, body.layout-split-right, body.layout-editorial-left, body.layout-editorial-right {
                flex-direction: column;
            }
            .layout-image-panel { min-height: 260px; flex: none; width: 100%; }
            .layout-form-panel { width: 100%; padding: 40px 28px; }
            body.layout-editorial-left .layout-image-panel,
            body.layout-editorial-right .layout-image-panel,
            body.layout-editorial-left .layout-form-panel,
            body.layout-editorial-right .layout-form-panel {
                border-radius: 0;
            }
            body.layout-showcase-banner .form-container {
                width: calc(100vw - 32px);
                margin-top: -64px;
            }
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
  const previewMode = !!options?.previewMode;
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

  const defaultHeroHeight =
    config.layout === 'banner-top' || config.layout === 'showcase-banner'
      ? (config.layout === 'showcase-banner' ? 420 : 260)
      : config.layout === 'split-left' || config.layout === 'split-right' || config.layout === 'editorial-left' || config.layout === 'editorial-right'
        ? 760
        : 420;
  const defaultPosX = Number(config.layoutImagePositionX ?? '50');
  const defaultPosY = Number(config.layoutImagePositionY ?? '50');
  const fallbackPosX = Number.isFinite(defaultPosX) ? defaultPosX : 50;
  const fallbackPosY = Number.isFinite(defaultPosY) ? defaultPosY : 50;
  const normalizedPageHeroEntries = Object.entries(config.pageHeroImages ?? {}).flatMap(([page, value]) => {
    const hero = normalizeHeroImageValue(value, {
      fallbackCropX: fallbackPosX,
      fallbackCropY: fallbackPosY,
      defaultHeight: defaultHeroHeight,
    });
    if (!hero) return [];
    return [[page, hero] as const];
  });
  const pageHeroMap = JSON.stringify(Object.fromEntries(normalizedPageHeroEntries));
  const defaultLayoutImg = config.layoutImageUrl ?? '';
  const multiPageScript = isMultiPage ? `
        var _PAGE_HERO = ${pageHeroMap};
        var _LAYOUT_IMG_DEFAULT = ${JSON.stringify(defaultLayoutImg)};
        var _LAYOUT_IMG_FIT = ${JSON.stringify(config.layoutImageFit || 'cover')};
        var _LAYOUT_POS_X = ${fallbackPosX};
        var _LAYOUT_POS_Y = ${fallbackPosY};
        var _LAYOUT_DEFAULT_HEIGHT = ${defaultHeroHeight};
        function _bgSizeForHero(fit, zoom) {
            var z = Number(zoom || 100);
            if (!isFinite(z)) z = 100;
            z = Math.max(50, Math.min(240, z));
            if (fit === 'tile') return { size: z === 100 ? 'auto' : (z + '%'), repeat: 'repeat' };
            if (fit === 'fill') return { size: z === 100 ? '100% 100%' : (z + '% ' + z + '%'), repeat: 'no-repeat' };
            if (fit === 'natural') return { size: z === 100 ? 'auto' : (z + '%'), repeat: 'no-repeat' };
            if (fit === 'zoom-in') return { size: Math.round(130 * (z / 100)) + '%', repeat: 'no-repeat' };
            if (fit === 'zoom-out') return { size: Math.round(70 * (z / 100)) + '%', repeat: 'no-repeat' };
            if (z !== 100) return { size: z + '%', repeat: 'no-repeat' };
            if (fit === 'contain') return { size: 'contain', repeat: 'no-repeat' };
            return { size: 'cover', repeat: 'no-repeat' };
        }
        function _resolveHero(pageIndex) {
            var val = _PAGE_HERO[pageIndex];
            if (val && typeof val === 'object' && val.url) {
                return {
                    url: val.url,
                    cropX: Number(val.cropX ?? _LAYOUT_POS_X),
                    cropY: Number(val.cropY ?? _LAYOUT_POS_Y),
                    zoom: Number(val.zoom ?? 100),
                    height: Number(val.height ?? _LAYOUT_DEFAULT_HEIGHT)
                };
            }
            if (_LAYOUT_IMG_DEFAULT) {
                return {
                    url: _LAYOUT_IMG_DEFAULT,
                    cropX: _LAYOUT_POS_X,
                    cropY: _LAYOUT_POS_Y,
                    zoom: 100,
                    height: _LAYOUT_DEFAULT_HEIGHT
                };
            }
            return null;
        }
        function _applyPageHero(pageIndex) {
            var panel = document.querySelector('.layout-image-panel') ||
                        document.querySelector('.layout-banner') ||
                        document.querySelector('.layout-backdrop');
            if (!panel) return;
            var hero = _resolveHero(pageIndex);
            if (!hero || !hero.url) {
                panel.style.backgroundImage = '';
                return;
            }
            var fit = _bgSizeForHero(_LAYOUT_IMG_FIT, hero.zoom);
            panel.style.backgroundImage = \"url('\" + hero.url + \"')\";
            panel.style.backgroundPosition = hero.cropX + '% ' + hero.cropY + '%';
            panel.style.backgroundSize = fit.size;
            panel.style.backgroundRepeat = fit.repeat;
            if (panel.classList.contains('layout-image-panel') || panel.classList.contains('layout-banner')) {
                var heroHeight = Math.max(180, Math.min(1200, Number(hero.height || _LAYOUT_DEFAULT_HEIGHT)));
                panel.style.minHeight = heroHeight + 'px';
                if (panel.classList.contains('layout-banner')) {
                    panel.style.height = heroHeight + 'px';
                }
                var formPanel = document.querySelector('.layout-form-panel');
                if (formPanel) {
                    formPanel.style.minHeight = heroHeight + 'px';
                }
            }
        }
        function goToPage(n) {
            var allPages = document.querySelectorAll('.form-page');
            var dots = document.querySelectorAll('.page-dot');
            allPages.forEach(function(p) { p.classList.remove('active'); });
            dots.forEach(function(d) { d.classList.remove('active'); });
            allPages[n].classList.add('active');
            dots[n].classList.add('active');
            _applyPageHero(n);
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
    ${generatePixelScripts(config, previewMode)}
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
            --button-text-color: ${theme.buttonTextColor || '#ffffff'};
            --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
            --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
            --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
            --radius: ${theme.borderRadius};
            --preview-mode: ${previewMode ? 1 : 0};
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
            width: 200px !important;
            flex-shrink: 0;
            font-size: 13px !important;
            padding-right: 28px !important;
        }
        .phone-number-input {
            flex: 1;
        }
        .email-otp-group { display: flex; flex-direction: column; gap: 8px; }
        .email-otp-row { display: flex; gap: 8px; align-items: stretch; }
        .email-otp-row .form-input { flex: 1; min-width: 0; }
        .email-otp-send-btn, .email-otp-verify-btn {
            border: 0;
            border-radius: 8px;
            background: var(--primary-gradient);
            color: #fff;
            padding: 0 14px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }
        .email-otp-send-btn:disabled, .email-otp-verify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .email-otp-status { min-height: 18px; font-size: 12px; color: var(--text-secondary); }

        /* ── Appointment Booking Widget ─────────────────────────────── */
        .appt-booking {
            border: 1px solid var(--border-focus, #4f80f7);
            border-radius: 12px;
            overflow: hidden;
            background: var(--bg-primary);
        }
        .appt-date-row {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            border-bottom: 1px solid var(--border-color);
            gap: 6px;
        }
        .appt-date-input {
            flex: 1;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 4px 8px !important;
            font-size: 14px;
            cursor: default;
        }
        .appt-cal-toggle {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            border-radius: 6px;
        }
        .appt-cal-toggle:hover { background: var(--bg-secondary); }
        .appt-main-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 360px;
        }
        @media (max-width: 560px) {
            .appt-main-panel { grid-template-columns: 1fr; }
        }
        .appt-cal-panel {
            border-right: 1px solid var(--border-color);
            padding: 14px 12px 10px;
        }
        .appt-month-year-nav {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .appt-nav-ctrl {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
        }
        .appt-sel {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            cursor: pointer;
            outline: none;
            appearance: none;
            -webkit-appearance: none;
        }
        .appt-arrows {
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .appt-arrow-btn {
            background: none;
            border: none;
            padding: 1px 3px;
            line-height: 1;
            font-size: 10px;
            cursor: pointer;
            color: var(--text-secondary);
        }
        .appt-arrow-btn:hover { color: var(--text-primary); }
        .appt-day-headers {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            margin-bottom: 4px;
        }
        .appt-day-hdr {
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            padding: 2px 0;
        }
        .appt-days-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }
        .appt-day-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.12s, color 0.12s;
            color: var(--text-primary);
            user-select: none;
        }
        .appt-day-cell:hover:not(.appt-day-disabled):not(.appt-day-today-sel) { background: var(--bg-secondary); }
        .appt-day-cell.appt-day-other-month { color: var(--text-secondary); opacity: 0.4; pointer-events: none; }
        .appt-day-cell.appt-day-disabled { opacity: 0.3; cursor: default; pointer-events: none; }
        .appt-day-cell.appt-day-today { font-weight: 700; color: var(--primary-color, #4f80f7); }
        .appt-day-cell.appt-day-selected { background: var(--primary-color, #4f80f7); color: #fff; font-weight: 600; }
        .appt-day-cell.appt-day-today-sel { background: var(--primary-color, #4f80f7); color: #fff; font-weight: 700; }
        .appt-slots-panel {
            padding: 14px 12px 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow: hidden;
        }
        .appt-slots-header {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .appt-selected-day-label {
            flex: 1;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .appt-day-nav {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            color: var(--text-primary);
        }
        .appt-day-nav:hover:not(:disabled) { background: var(--bg-primary); border-color: var(--border-focus); }
        .appt-day-nav:disabled { opacity: 0.3; cursor: default; }
        .appt-time-slots-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            flex: 1;
            overflow-y: auto;
            align-content: start;
            max-height: 260px;
            padding-right: 2px;
        }
        .appt-slot-detail {
            border: 1px solid var(--border-color);
            border-radius: 12px;
            background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.88));
            padding: 12px;
            min-height: 72px;
        }
        .appt-slot-detail-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-primary);
        }
        .appt-slot-detail-meta {
            margin-top: 4px;
            font-size: 12px;
            line-height: 1.5;
            color: var(--text-secondary);
        }
        .appt-time-btn {
            border: 1px solid var(--border-color, #c6d0e8);
            background: var(--bg-primary);
            border-radius: 12px;
            padding: 12px 10px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            cursor: pointer;
            text-align: left;
            transition: all 0.12s;
            display: flex;
            flex-direction: column;
            gap: 2px;
            box-shadow: var(--shadow-sm);
        }
        .appt-time-btn:hover { border-color: var(--primary-color, #4f80f7); background: var(--bg-secondary); transform: translateY(-1px); }
        .appt-time-btn.selected { background: var(--primary-color, #4f80f7); color: #fff; border-color: var(--primary-color, #4f80f7); }
        .appt-time-btn:disabled { opacity: 0.35; cursor: default; }
        .appt-time-btn.appt-time-btn-full { text-decoration: line-through; }
        .appt-time-btn-time {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.2;
        }
        .appt-time-btn-meta {
            font-size: 11px;
            opacity: 0.8;
            line-height: 1.3;
        }
        .appt-no-slots {
            grid-column: 1 / -1;
            text-align: center;
            font-size: 13px;
            color: var(--text-secondary);
            padding: 20px 0;
        }
        .appt-tz-row {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: var(--text-secondary);
            border-top: 1px solid var(--border-color);
            padding-top: 8px;
            margin-top: auto;
        }
        .appt-tz-label { font-weight: 500; }
        .appt-tz-offset { opacity: 0.75; }
        .appt-tz-toggle {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 10px;
            padding: 0 2px;
        }
        .appt-tz-toggle:hover { color: var(--text-primary); }

        /* ── Services-mode appointment widget ── */
        .appt-services-mode {
            border: 1.5px solid var(--border-focus, #4f80f7);
            border-radius: 16px;
            overflow: hidden;
            background: var(--bg-primary);
            box-shadow: 0 4px 24px rgba(79,128,247,0.07), 0 1px 4px rgba(0,0,0,0.04);
        }
        .appt-svc-tabs-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 14px 16px 12px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        .appt-svc-tab {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding: 8px 14px;
            border: 1.5px solid var(--border-color);
            border-radius: 12px;
            background: var(--bg-primary);
            cursor: pointer;
            font-size: 13px;
            transition: all 0.18s ease;
            color: var(--text-primary);
            font-weight: 500;
        }
        .appt-svc-tab:hover { border-color: var(--primary-color, #4f80f7); background: var(--bg-secondary); box-shadow: 0 2px 8px rgba(79,128,247,0.12); }
        .appt-svc-tab.active { background: var(--primary-color, #4f80f7); border-color: var(--primary-color, #4f80f7); color: #fff; box-shadow: 0 4px 16px rgba(79,128,247,0.28); }
        .appt-svc-tab-name { font-weight: 700; font-size: 13px; }
        .appt-svc-tab-sub { font-size: 11px; font-weight: 400; opacity: 0.85; }
        .appt-svc-tab-dur { font-size: 11px; opacity: 0.8; }
        .appt-svc-tab.active .appt-svc-tab-dur { opacity: 0.9; color: rgba(255,255,255,0.9); }
        .appt-svc-panels {
            padding: 16px;
        }
        .appt-svc-panel { display: flex; flex-direction: column; gap: 18px; }
        .appt-svc-date-group { }
        .appt-svc-date-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11.5px;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.07em;
            margin-bottom: 10px;
        }
        .appt-svc-date-header::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border-color);
            opacity: 0.6;
        }
        .appt-svc-slots-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .appt-svc-slot-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 10px 16px;
            border: 1.5px solid var(--border-color, #c6d0e8);
            border-radius: 12px;
            background: var(--bg-primary);
            cursor: pointer;
            transition: all 0.18s ease;
            font-size: 13px;
            color: var(--text-primary);
            min-width: 76px;
            position: relative;
        }
        .appt-svc-slot-btn:hover:not(:disabled) {
            border-color: var(--primary-color, #4f80f7);
            background: var(--bg-secondary);
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(79,128,247,0.14);
        }
        .appt-svc-slot-btn.selected {
            background: var(--primary-color, #4f80f7);
            border-color: var(--primary-color, #4f80f7);
            color: #fff;
            box-shadow: 0 4px 20px rgba(79,128,247,0.32);
            transform: translateY(-1px);
        }
        .appt-svc-slot-btn:disabled { opacity: 0.42; cursor: default; }
        .appt-svc-slot-time { font-weight: 800; font-size: 14px; letter-spacing: -0.01em; }
        .appt-svc-slot-rem { font-size: 10px; opacity: 0.7; font-weight: 500; }
        .appt-svc-slot-btn.selected .appt-svc-slot-rem { opacity: 0.85; color: rgba(255,255,255,0.9); }
        .appt-svc-slot-full .appt-svc-slot-time { text-decoration: line-through; opacity: 0.6; }
        .appt-badge-full {
            font-size: 10px;
            font-weight: 600;
            background: rgba(239,68,68,0.1);
            color: #ef4444;
            border-radius: 6px;
            padding: 2px 6px;
            border: 1px solid rgba(239,68,68,0.15);
        }
        .appt-svc-selection-summary {
            padding: 10px 16px 14px;
            font-size: 13px;
            font-weight: 600;
            color: var(--primary-color, #4f80f7);
            min-height: 20px;
        }
        .appt-svc-booking-note {
            margin: 12px 16px 0;
            padding: 10px 14px;
            font-size: 12.5px;
            color: var(--text-secondary);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            line-height: 1.5;
        }
        .appt-svc-single-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 16px 12px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        .appt-svc-tz-row {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 6px 16px 10px;
            font-size: 11px;
            color: var(--text-secondary);
            opacity: 0.65;
        }
        .appt-svc-tz-label { font-weight: 600; }
        .appt-loading { font-style: italic; }


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
            color: var(--button-text-color) !important;
            font-family: inherit;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
            isolation: isolate;
            text-shadow: 0 1px 1px rgba(15, 23, 42, 0.18);
        }
        .submit-btn::before {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s;
            pointer-events: none;
        }
        .submit-btn:hover {
            color: var(--button-text-color) !important;
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:active { transform: translateY(-1px); }
        .submit-btn:disabled {
            background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
            cursor: not-allowed; transform: none; box-shadow: var(--shadow-sm);
        }
        .page-nav .submit-btn,
        .page-nav .submit-btn:hover {
            border: none;
            color: var(--button-text-color) !important;
        }
        .success-message { text-align: center; padding: 40px 20px; }
        .success-message h2 { font-size: 48px; margin-bottom: 12px; }
        .success-message p { font-size: 16px; color: var(--text-secondary); }
        .form-status {
            display: none;
            margin-top: 16px;
            padding: 12px 14px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 500;
            line-height: 1.5;
            border: 1px solid var(--border-color);
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        .form-status.is-error {
            border-color: rgba(220, 38, 38, 0.25);
            background: rgba(254, 242, 242, 0.95);
            color: #b91c1c;
        }
        .form-status.is-success {
            border-color: rgba(22, 163, 74, 0.25);
            background: rgba(240, 253, 244, 0.95);
            color: #166534;
        }
        ${getLayoutGridCss(layout, theme.fieldGap || '16px')}
        ${paginationStyles}
        @media (max-width: 640px) {
            .form-body { padding: 20px 20px 24px; }
            .form-header { padding: 24px 20px 8px; }
            .phone-input-group { flex-direction: column; }
            .country-code-select { width: 100% !important; }
            .email-otp-row { flex-direction: column; }
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
        /* ── Bookings Table ─────────────────────────────────────────────── */
        .msess-bookings { padding: 0 16px 16px; }
        .msess-bookings-loading, .msess-bookings-empty, .msess-bookings-error {
          padding: 12px 0; font-size: 13px; color: var(--text-secondary); text-align: center;
        }
        .msess-bookings-error { color: #ef4444; }
        .msess-bookings-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0 8px; font-size: 11px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.06em;
          border-top: 1px solid var(--border-color); margin-top: 4px;
        }
        .msess-bookings-scroll { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 6px; }
        .msess-bookings-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .msess-bookings-table thead th {
          background: var(--bg-secondary); padding: 8px 10px; text-align: left;
          font-size: 11px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color); white-space: nowrap;
        }
        .msess-bookings-table tbody tr { border-bottom: 1px solid var(--border-color); }
        .msess-bookings-table tbody tr:last-child { border-bottom: none; }
        .msess-bookings-table tbody tr:hover { background: var(--bg-secondary); }
        .msess-bookings-table tbody td { padding: 7px 10px; vertical-align: middle; color: var(--text-primary); }
        .msess-td-num { color: var(--text-secondary); font-size: 11px; width: 28px; text-align: center; }
        .msess-td-name { display: flex; align-items: center; gap: 7px; white-space: nowrap; font-weight: 500; }
        .msess-member-avatar { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .msess-cancelled-badge { font-size: 10px; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; border-radius: 4px; padding: 1px 5px; font-weight: 600; }
        .msess-row-cancelled td { opacity: 0.55; }
        .msess-booking-comment { width: 100%; min-width: 160px; min-height: 60px; resize: vertical; padding: 5px 8px !important; font-size: 12px !important; }
        .msess-booking-status { min-width: 180px; padding: 4px 8px !important; font-size: 12px !important; }
        .msess-save-comments-btn {
          margin-top: 10px; padding: 7px 16px; font-size: 12px; font-weight: 600;
          background: var(--primary-color); color: #fff; border: none; border-radius: 8px;
          cursor: pointer; transition: opacity 0.15s;
        }
        .msess-save-comments-btn:hover { opacity: 0.88; }
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
    ${['split-left','split-right','editorial-left','editorial-right'].includes(config.layout ?? '') ? `<div class="layout-image-panel"><div class="layout-image-overlay"></div></div>` : ''}
    ${['banner-top','showcase-banner'].includes(config.layout ?? '') ? `<div class="layout-banner"></div>` : ''}
    ${config.layout === 'floating' ? `<div class="layout-backdrop"></div>` : ''}
    ${['split-left','split-right','editorial-left','editorial-right'].includes(config.layout ?? '') ? '<div class="layout-form-panel">' : ''}
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
            <div id="form-status" class="form-status" aria-live="polite"></div>
            <div id="address-display" style="display:none; align-items:center; gap:8px; margin-top:16px; padding:14px 16px; background:var(--bg-secondary); border-radius:8px; border:1px solid var(--border-color);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span id="location-address" style="font-size:13px; color:var(--text-secondary);"></span>
            </div>
        </div>
        ${config.footer ? `<div class="form-footer">${escapeHtml(config.footer)}</div>` : ''}
    </div>
    ${['split-left','split-right','editorial-left','editorial-right'].includes(config.layout ?? '') ? '</div>' : ''}
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
        ${generateEmailOtpScript(config)}
        ${generateAppointmentSlotsScript(config)}
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

/* ===== WINLERR ADMIN DASHBOARD ===== */

let adminUser = null

// ===== AUTH =====
async function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const btn = document.getElementById('loginBtn')
  const errEl = document.getElementById('loginError')

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...'
  btn.disabled = true
  errEl.style.display = 'none'

  if (!window.WinlerrDB) {
    errEl.textContent = 'Supabase not initialized. Check configuration.'
    errEl.style.display = 'block'
    btn.innerHTML = '<i class="fas fa-lock"></i> Sign In'
    btn.disabled = false
    return
  }

  const { data, error } = await window.WinlerrDB.adminLogin(email, password)
  if (error) {
    errEl.textContent = error.message || 'Login failed. Check your credentials.'
    errEl.style.display = 'block'
    btn.innerHTML = '<i class="fas fa-lock"></i> Sign In'
    btn.disabled = false
    return
  }

  // Check if user is admin
  const user = await window.WinlerrDB.getCurrentUser()
  if (!user) {
    errEl.textContent = 'Could not verify user.'
    errEl.style.display = 'block'
    btn.innerHTML = '<i class="fas fa-lock"></i> Sign In'
    btn.disabled = false
    return
  }

  const { data: profile } = await window.WinlerrDB.checkAdminStatus(user.id)
  if (!profile) {
    await window.WinlerrDB.adminLogout()
    errEl.textContent = 'Access denied. You are not registered as an admin.'
    errEl.style.display = 'block'
    btn.innerHTML = '<i class="fas fa-lock"></i> Sign In'
    btn.disabled = false
    return
  }

  adminUser = { ...user, ...profile }
  showDashboard()
}

async function handleLogout() {
  await window.WinlerrDB.adminLogout()
  adminUser = null
  document.getElementById('adminDashboard').style.display = 'none'
  document.getElementById('loginScreen').style.display = 'flex'
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none'
  document.getElementById('adminDashboard').style.display = 'flex'
  document.getElementById('adminProfileInfo').textContent =
    `Logged in as ${adminUser.full_name || adminUser.email} (${adminUser.role})`
  refreshData()
}

// ===== AUTO-LOGIN CHECK =====
async function checkSession() {
  if (!window.WinlerrDB) return
  const user = await window.WinlerrDB.getCurrentUser()
  if (user) {
    const { data: profile } = await window.WinlerrDB.checkAdminStatus(user.id)
    if (profile) {
      adminUser = { ...user, ...profile }
      showDashboard()
    }
  }
}

// ===== TAB NAVIGATION =====
document.addEventListener('click', e => {
  const link = e.target.closest('.admin-nav-link')
  if (!link || !link.dataset.tab) return
  e.preventDefault()
  document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'))
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'))
  link.classList.add('active')
  const tab = document.getElementById('tab-' + link.dataset.tab)
  if (tab) tab.classList.add('active')
  document.getElementById('pageTitle').textContent = link.querySelector('span')?.textContent || 'Overview'
  if (link.dataset.tab === 'settings') loadFailedBackups()
})

// ===== DATA LOADING =====
async function refreshData() {
  if (!window.WinlerrDB || !adminUser) return
  await Promise.all([
    loadStats(),
    renderWaitlist(),
    renderPrototypes(),
    renderSuggestions(),
    renderNewsletter(),
    loadOverview(),
    loadFailedBackups(),
  ])
}

async function loadStats() {
  const s = await window.WinlerrDB.fetchStats()
  document.getElementById('stat-waitlist').textContent = s.totalWaitlist || 0
  document.getElementById('stat-prototypes').textContent = s.totalPrototypes || 0
  document.getElementById('stat-suggestions').textContent = s.totalSuggestions || 0
  document.getElementById('stat-campaigns').textContent = s.totalCampaigns || 0
  document.getElementById('badge-waitlist').textContent = s.totalWaitlist || 0
  document.getElementById('badge-prototypes').textContent = s.totalPrototypes || 0
  document.getElementById('badge-suggestions').textContent = s.totalSuggestions || 0
}

async function loadOverview() {
  const { data: waitlist } = await window.WinlerrDB.fetchWaitlistLeads()
  const { data: prototypes } = await window.WinlerrDB.fetchPrototypeRequests()

  // Recent waitlist
  const recentW = (waitlist || []).slice(0, 5)
  const rwEl = document.getElementById('recentWaitlist')
  rwEl.innerHTML = recentW.length
    ? recentW.map(r => `<div class="recent-item"><span class="recent-name">${esc(r.full_name)}</span><span class="recent-meta">${esc(r.business_name || '—')} · ${fmtDate(r.created_at)}</span></div>`).join('')
    : '<p class="empty-state">No signups yet</p>'

  // Recent prototypes
  const recentP = (prototypes || []).slice(0, 5)
  const rpEl = document.getElementById('recentPrototypes')
  rpEl.innerHTML = recentP.length
    ? recentP.map(r => `<div class="recent-item"><span class="recent-name">${esc(r.business_name)}</span><span class="recent-meta">${esc(r.full_name)} · ${fmtDate(r.created_at)}</span></div>`).join('')
    : '<p class="empty-state">No requests yet</p>'

  // Top countries
  const countries = {}
  ;(waitlist || []).forEach(r => { if (r.country) countries[r.country] = (countries[r.country] || 0) + 1 })
  const tcEl = document.getElementById('topCountries')
  const tc = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 6)
  tcEl.innerHTML = tc.length
    ? tc.map(([k, v]) => `<div class="list-item"><span>${esc(k)}</span><span class="list-count">${v}</span></div>`).join('')
    : '<p class="empty-state">No data</p>'

  // Top business types
  const types = {}
  ;(waitlist || []).forEach(r => { if (r.business_type) types[r.business_type] = (types[r.business_type] || 0) + 1 })
  const btEl = document.getElementById('topBusinessTypes')
  const bt = Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 6)
  btEl.innerHTML = bt.length
    ? bt.map(([k, v]) => `<div class="list-item"><span>${esc(k)}</span><span class="list-count">${v}</span></div>`).join('')
    : '<p class="empty-state">No data</p>'
}

// ===== WAITLIST =====
async function renderWaitlist() {
  const { data } = await window.WinlerrDB.fetchWaitlistLeads()
  const q = (document.getElementById('waitlistSearch')?.value || '').toLowerCase()
  const filtered = (data || []).filter(r =>
    r.full_name?.toLowerCase().includes(q) ||
    r.business_name?.toLowerCase().includes(q) ||
    r.email?.toLowerCase().includes(q)
  )
  const tbody = document.getElementById('waitlistBody')
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="12"><p class="empty-state">No leads found</p></td></tr>'
    return
  }
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${fmtDate(r.created_at)}</td>
      <td><strong>${esc(r.full_name)}</strong></td>
      <td>${esc(r.business_name || '—')}</td>
      <td>${esc(r.country || '—')}</td>
      <td>${esc(r.business_type || '—')}</td>
      <td>${esc(r.main_goal || '—')}</td>
      <td>${esc(r.whatsapp || '—')}</td>
      <td>${esc(r.email || '—')}</td>
      <td>${r.has_website || '—'}</td>
      <td>${r.email_consent ? '<span style="color:#10B981">Yes</span>' : '<span style="color:#94A3B8">No</span>'}</td>
      <td>
        <select class="status-select" onchange="updateWaitlistStatus('${r.id}', this.value)">
          ${['New','Contacted','Interested','Prototype Requested','Converted','Not Interested'].map(s =>
            `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td><button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteItem('waitlist_leads','${r.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>
  `).join('')
}

async function updateWaitlistStatus(id, status) {
  await window.WinlerrDB.updateRecord('waitlist_leads', id, { status })
  renderWaitlist()
  loadStats()
}

// ===== PROTOTYPES =====
async function renderPrototypes() {
  const { data } = await window.WinlerrDB.fetchPrototypeRequests()
  const q = (document.getElementById('prototypeSearch')?.value || '').toLowerCase()
  const filtered = (data || []).filter(r =>
    r.full_name?.toLowerCase().includes(q) ||
    r.business_name?.toLowerCase().includes(q) ||
    r.email?.toLowerCase().includes(q)
  )
  const tbody = document.getElementById('prototypeBody')
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="11"><p class="empty-state">No requests found</p></td></tr>'
    return
  }
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${fmtDate(r.created_at)}</td>
      <td><strong>${esc(r.full_name)}</strong></td>
      <td>${esc(r.business_name)}</td>
      <td>${esc(r.industry || '—')}</td>
      <td>${esc(r.country || '—')}</td>
      <td>${esc(r.prototype_type || '—')}</td>
      <td>${esc(r.brand_style || '—')}</td>
      <td>${esc((r.customer_actions || []).join(', ') || '—')}</td>
      <td>${esc(r.whatsapp || '—')}</td>
      <td>
        <select class="status-select" onchange="updatePrototypeStatus('${r.id}', this.value)">
          ${['New','In Review','Prototype Started','Prototype Sent','Waiting Feedback','Converted','Closed'].map(s =>
            `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td>
        <div class="action-cell">
          <button class="admin-btn admin-btn-sm" onclick="viewPrototype('${r.id}')"><i class="fas fa-eye"></i></button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteItem('prototype_requests','${r.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('')
}

async function updatePrototypeStatus(id, status) {
  await window.WinlerrDB.updateRecord('prototype_requests', id, { status })
  renderPrototypes()
  loadStats()
}

// ===== SUGGESTIONS =====
async function renderSuggestions() {
  const { data } = await window.WinlerrDB.fetchFeatureSuggestions()
  const q = (document.getElementById('suggestionSearch')?.value || '').toLowerCase()
  const filtered = (data || []).filter(r =>
    r.full_name?.toLowerCase().includes(q) ||
    r.business_name?.toLowerCase().includes(q) ||
    r.feature?.toLowerCase().includes(q)
  )
  const tbody = document.getElementById('suggestionBody')
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7"><p class="empty-state">No suggestions found</p></td></tr>'
    return
  }
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${fmtDate(r.created_at)}</td>
      <td><strong>${esc(r.full_name || '—')}</strong></td>
      <td>${esc(r.business_name || '—')}</td>
      <td style="max-width:250px;white-space:normal">${esc(r.feature)}</td>
      <td style="max-width:200px;white-space:normal">${esc(r.reason || '—')}</td>
      <td>
        <select class="status-select" onchange="updateSuggestionStatus('${r.id}', this.value)">
          ${['New','Reviewed','Planned','Rejected','Implemented'].map(s =>
            `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td><button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteItem('feature_suggestions','${r.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>
  `).join('')
}

async function updateSuggestionStatus(id, status) {
  await window.WinlerrDB.updateRecord('feature_suggestions', id, { status })
  renderSuggestions()
  loadStats()
}

// ===== DELETE =====
async function deleteItem(table, id) {
  if (!confirm('Delete this record?')) return
  await window.WinlerrDB.deleteRecord(table, id)
  refreshData()
}

// ===== PROTOTYPE DETAIL =====
function viewPrototype(id) {
  // Store ID and show modal with data
  window._protoDetailId = id
  const el = document.getElementById('modal-prototype-detail')
  el.classList.add('active')
  document.body.style.overflow = 'hidden'
  // Content will be loaded via the prototype data we already have
  const content = document.getElementById('prototypeDetailContent')
  content.innerHTML = '<p class="empty-state">Loading...</p>'
  document.getElementById('prototypeAdminNotes').value = ''
  // Fetch latest
  window.WinlerrDB.fetchPrototypeRequests().then(({ data }) => {
    const r = (data || []).find(d => d.id === id)
    if (r) {
      content.innerHTML = `
        <p><strong>Business:</strong> ${esc(r.business_name)}</p>
        <p><strong>Contact:</strong> ${esc(r.full_name)} (${esc(r.email || '—')} / ${esc(r.whatsapp || '—')})</p>
        <p><strong>Industry:</strong> ${esc(r.industry || '—')} · <strong>Country:</strong> ${esc(r.country || '—')}</p>
        <p><strong>Prototype Type:</strong> ${esc(r.prototype_type || '—')} · <strong>Style:</strong> ${esc(r.brand_style || '—')}</p>
        <p><strong>Customer Actions:</strong> ${esc((r.customer_actions || []).join(', ') || '—')}</p>
        <p><strong>Description:</strong> ${esc(r.business_description || 'No description')}</p>
        ${r.existing_website ? `<p><strong>Website:</strong> ${esc(r.existing_website)}</p>` : ''}
        ${r.social_links ? `<p><strong>Social:</strong> ${esc(r.social_links)}</p>` : ''}
        <p style="margin-top:.75rem"><strong>Status:</strong> <span class="badge-${r.status?.replace(/\s/g,'\\ ')}" style="padding:.15rem .5rem;border-radius:100px;font-size:.75rem">${r.status}</span></p>
      `
      document.getElementById('prototypeAdminNotes').value = r.admin_notes || ''
    }
  })
}

async function savePrototypeNotes() {
  const id = window._protoDetailId
  const notes = document.getElementById('prototypeAdminNotes').value.trim()
  if (!id) return
  await window.WinlerrDB.updateRecord('prototype_requests', id, { admin_notes: notes })
  alert('Notes saved.')
}

// ===== NEWSLETTER =====
async function renderNewsletter() {
  const { data } = await window.WinlerrDB.fetchNewsletterCampaigns()
  const tbody = document.getElementById('newsletterBody')
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="7"><p class="empty-state">No campaigns yet. Create your first one.</p></td></tr>'
    return
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.email_sequence || '—'}</td>
      <td><strong>${esc(r.title)}</strong></td>
      <td>${esc(r.subject)}</td>
      <td><span class="badge-${r.status}" style="padding:.15rem .5rem;border-radius:100px;font-size:.7rem">${r.status}</span></td>
      <td>${r.planned_send_date ? fmtDate(r.planned_send_date) : '—'}</td>
      <td>${r.sent_at ? fmtDate(r.sent_at) : '—'}</td>
      <td>
        <div class="action-cell">
          <button class="admin-btn admin-btn-sm" onclick="editNewsletter('${r.id}')"><i class="fas fa-edit"></i></button>
          <button class="admin-btn admin-btn-sm" onclick="duplicateNewsletter('${r.id}')"><i class="fas fa-copy"></i></button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteNewsletter('${r.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('')
}

function openNewsletterEditor() {
  document.getElementById('newsletterId').value = ''
  document.getElementById('newsletterForm').reset()
  document.getElementById('newsletterEditorTitle').textContent = 'New Campaign'
  document.getElementById('newsletterSuccess').style.display = 'none'
  document.getElementById('modal-newsletter').classList.add('active')
  document.body.style.overflow = 'hidden'
}

function closeNewsletterEditor() {
  document.getElementById('modal-newsletter').classList.remove('active')
  document.body.style.overflow = ''
}

async function saveNewsletter(e) {
  e.preventDefault()
  const id = document.getElementById('newsletterId').value
  const data = {
    title: document.getElementById('newsletterTitle').value.trim(),
    subject: document.getElementById('newsletterSubject').value.trim(),
    bodyHtml: document.getElementById('newsletterBodyHtml').value.trim(),
    status: document.getElementById('newsletterStatus').value,
    emailSequence: parseInt(document.getElementById('newsletterSeq').value) || null,
    plannedSendDate: document.getElementById('newsletterDate').value || null,
  }
  const sucEl = document.getElementById('newsletterSuccess')

  if (id) {
    await window.WinlerrDB.updateNewsletter(id, data)
  } else {
    await window.WinlerrDB.createNewsletter(data)
  }

  sucEl.innerHTML = '<i class="fas fa-check-circle"></i> Campaign saved.'
  sucEl.style.display = 'flex'
  renderNewsletter()
  setTimeout(closeNewsletterEditor, 1500)
}

async function editNewsletter(id) {
  const { data } = await window.WinlerrDB.fetchNewsletterCampaigns()
  const r = (data || []).find(d => d.id === id)
  if (!r) return
  document.getElementById('newsletterId').value = id
  document.getElementById('newsletterTitle').value = r.title || ''
  document.getElementById('newsletterSubject').value = r.subject || ''
  document.getElementById('newsletterBodyHtml').value = r.body_html || ''
  document.getElementById('newsletterStatus').value = r.status || 'Draft'
  document.getElementById('newsletterSeq').value = r.email_sequence || ''
  document.getElementById('newsletterDate').value = r.planned_send_date ? r.planned_send_date.slice(0,16) : ''
  document.getElementById('newsletterEditorTitle').textContent = 'Edit Campaign'
  document.getElementById('newsletterSuccess').style.display = 'none'
  document.getElementById('modal-newsletter').classList.add('active')
  document.body.style.overflow = 'hidden'
}

async function duplicateNewsletter(id) {
  const { data } = await window.WinlerrDB.fetchNewsletterCampaigns()
  const r = (data || []).find(d => d.id === id)
  if (!r) return
  await window.WinlerrDB.createNewsletter({
    title: r.title + ' (Copy)',
    subject: r.subject,
    bodyHtml: r.body_html,
    status: 'Draft',
    emailSequence: null,
  })
  renderNewsletter()
}

async function deleteNewsletter(id) {
  if (!confirm('Delete this campaign?')) return
  await window.WinlerrDB.deleteNewsletter(id)
  renderNewsletter()
}

async function sendTestNewsletter() {
  const html = document.getElementById('newsletterBodyHtml').value.trim()
  const subject = document.getElementById('newsletterSubject').value.trim()
  if (!html || !subject) {
    alert('Please fill in subject and body first.')
    return
  }
  const result = await window.WinlerrDB.callResendApi('sendTest', { subject, html })
  if (result.error) {
    alert('Test email failed: ' + (result.error.message || JSON.stringify(result.error)))
  } else {
    alert('Test email sent to admin.')
  }
}

// ===== EXPORT =====
async function exportData() {
  const [w, p, s] = await Promise.all([
    window.WinlerrDB.fetchWaitlistLeads(),
    window.WinlerrDB.fetchPrototypeRequests(),
    window.WinlerrDB.fetchFeatureSuggestions(),
  ])
  const all = {
    exportedAt: new Date().toISOString(),
    waitlist: w.data || [],
    prototypes: p.data || [],
    suggestions: s.data || [],
  }
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `winlerr-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ===== HELPERS =====
function esc(s) {
  if (!s && s !== 0) return '—'
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
  catch { return iso }
}

// ===== SETTINGS: FAILED BACKUPS =====
function loadFailedBackups() {
  const keys = ['winlerr_waitlist_fallback', 'winlerr_prototypes_fallback', 'winlerr_suggestions_fallback']
  let all = []
  keys.forEach(key => {
    try {
      const items = JSON.parse(localStorage.getItem(key)) || []
      all = all.concat(items.map(i => ({ ...i, _storageKey: key })))
    } catch {}
  })
  const el = document.getElementById('failedBackups')
  if (!all.length) {
    el.innerHTML = '<p class="empty-state">No failed backups</p>'
    return
  }
  el.innerHTML = all.map((item, idx) =>
    `<div class="recent-item">
      <span class="recent-name">${esc(item.fullName || item.full_name || 'Unknown')}</span>
      <span class="recent-meta">${item._storageKey} · ${fmtDate(item._savedAt)}</span>
    </div>`
  ).join('')
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  checkSession()
  // Re-check when supabase client is ready
  const checkInterval = setInterval(() => {
    if (window.WinlerrDB) {
      clearInterval(checkInterval)
      checkSession()
    }
  }, 500)
})

// Override closeModal for admin-specific modals
function closeModal(name) {
  const el = document.getElementById('modal-' + name)
  if (el) {
    el.classList.remove('active')
    document.body.style.overflow = ''
  }
}

// Expose globals
window.handleLogin = handleLogin
window.handleLogout = handleLogout
window.refreshData = refreshData
window.exportData = exportData
window.renderWaitlist = renderWaitlist
window.renderPrototypes = renderPrototypes
window.renderSuggestions = renderSuggestions
window.updateWaitlistStatus = updateWaitlistStatus
window.updatePrototypeStatus = updatePrototypeStatus
window.updateSuggestionStatus = updateSuggestionStatus
window.deleteItem = deleteItem
window.viewPrototype = viewPrototype
window.savePrototypeNotes = savePrototypeNotes
window.openNewsletterEditor = openNewsletterEditor
window.closeNewsletterEditor = closeNewsletterEditor
window.saveNewsletter = saveNewsletter
window.editNewsletter = editNewsletter
window.duplicateNewsletter = duplicateNewsletter
window.deleteNewsletter = deleteNewsletter
window.sendTestNewsletter = sendTestNewsletter
window.closeModal = closeModal

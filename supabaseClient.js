/* ===== WINLERR SUPABASE CLIENT ===== */
// Loads Supabase from CDN. Set window.__SUPABASE_CONFIG before this script.
// Config: { url: '...', anonKey: '...' }

const CONFIG = window.__SUPABASE_CONFIG || {}

if (!CONFIG.url || !CONFIG.anonKey) {
  console.warn('[Winlerr] Supabase config missing. Set window.__SUPABASE_CONFIG before loading.')
}

const supabaseUrl = CONFIG.url || ''
const supabaseAnonKey = CONFIG.anonKey || ''

// Will be set after createClient loads
window.supabaseClient = null
window.supabaseAdmin = null

async function initSupabase() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  window.supabaseClient = client

  // If service role key is available (admin-only context), create admin client
  if (CONFIG.serviceRoleKey) {
    const admin = createClient(supabaseUrl, CONFIG.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    window.supabaseAdmin = admin
  }
}

// ===== PUBLIC INSERTS =====
async function insertWaitlistLead(data) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient.from('waitlist_leads').insert({
    full_name: data.fullName,
    email: data.email || null,
    whatsapp: data.whatsapp || null,
    business_name: data.businessName,
    country: data.country,
    business_type: data.businessType,
    has_website: data.hasWebsite,
    main_goal: data.mainGoal,
    email_consent: data.emailConsent || false,
    source: 'landing_page',
  })
}

async function insertPrototypeRequest(data) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient.from('prototype_requests').insert({
    full_name: data.fullName,
    email: data.email || null,
    whatsapp: data.whatsapp || null,
    business_name: data.businessName,
    industry: data.industry,
    country: data.country,
    existing_website: data.existingWebsite || null,
    social_links: data.socialLinks || null,
    prototype_type: data.prototypeType,
    business_description: data.businessDescription,
    customer_actions: data.customerActions || [],
    brand_style: data.brandStyle,
    email_consent: data.emailConsent || false,
    selected_package: data.selectedPackage || null,
    selected_currency: data.selectedCurrency || null,
    displayed_setup_price: data.displayedSetupPrice || null,
    displayed_monthly_price: data.displayedMonthlyPrice || null,
  })
}

async function insertFeatureSuggestion(data) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient.from('feature_suggestions').insert({
    full_name: data.fullName,
    business_name: data.businessName,
    email: data.email || null,
    whatsapp: data.whatsapp || null,
    feature: data.feature,
    reason: data.reason || null,
  })
}

// ===== ADMIN AUTH =====
async function adminLogin(email, password) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient.auth.signInWithPassword({ email, password })
}

async function adminLogout() {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient.auth.signOut()
}

async function getCurrentUser() {
  if (!window.supabaseClient) await initSupabase()
  const { data: { user } } = await window.supabaseClient.auth.getUser()
  return user
}

async function checkAdminStatus(userId) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('admin_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle()
}

// ===== ADMIN DATA FETCHERS =====
async function fetchWaitlistLeads() {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('waitlist_leads')
    .select('*')
    .order('created_at', { ascending: false })
}

async function fetchPrototypeRequests() {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('prototype_requests')
    .select('*')
    .order('created_at', { ascending: false })
}

async function fetchFeatureSuggestions() {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('feature_suggestions')
    .select('*')
    .order('created_at', { ascending: false })
}

async function fetchNewsletterCampaigns() {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
}

async function updateRecord(table, id, updates) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
}

async function deleteRecord(table, id) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from(table)
    .delete()
    .eq('id', id)
}

async function fetchStats() {
  if (!window.supabaseClient) await initSupabase()
  const { count: totalWaitlist } = await window.supabaseClient
    .from('waitlist_leads')
    .select('*', { count: 'exact', head: true })

  const { count: totalPrototypes } = await window.supabaseClient
    .from('prototype_requests')
    .select('*', { count: 'exact', head: true })

  const { count: totalSuggestions } = await window.supabaseClient
    .from('feature_suggestions')
    .select('*', { count: 'exact', head: true })

  const { count: totalCampaigns } = await window.supabaseClient
    .from('newsletter_campaigns')
    .select('*', { count: 'exact', head: true })

  return { totalWaitlist, totalPrototypes, totalSuggestions, totalCampaigns }
}

// ===== NEWSLETTER CRUD =====
async function createNewsletter(data) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient.from('newsletter_campaigns').insert({
    title: data.title,
    subject: data.subject,
    body_html: data.bodyHtml,
    status: data.status || 'Draft',
    email_sequence: data.emailSequence || null,
    planned_send_date: data.plannedSendDate || null,
  }).select()
}

async function updateNewsletter(id, data) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('newsletter_campaigns')
    .update({
      title: data.title,
      subject: data.subject,
      body_html: data.bodyHtml,
      status: data.status,
      email_sequence: data.emailSequence || null,
      planned_send_date: data.plannedSendDate || null,
    })
    .eq('id', id)
    .select()
}

async function deleteNewsletter(id) {
  if (!window.supabaseClient) await initSupabase()
  return window.supabaseClient
    .from('newsletter_campaigns')
    .delete()
    .eq('id', id)
}

// ===== PUBLISH API (called from admin) =====
// Resend calls go through a thin API wrapper to avoid exposing the key
async function callResendApi(action, payload) {
  const apiUrl = CONFIG.resendApiUrl || '/api/resend'
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  return res.json()
}

// Expose globally
window.WinlerrDB = {
  initSupabase,
  insertWaitlistLead,
  insertPrototypeRequest,
  insertFeatureSuggestion,
  adminLogin,
  adminLogout,
  getCurrentUser,
  checkAdminStatus,
  fetchWaitlistLeads,
  fetchPrototypeRequests,
  fetchFeatureSuggestions,
  fetchNewsletterCampaigns,
  updateRecord,
  deleteRecord,
  fetchStats,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  callResendApi,
}

// Auto-init
initSupabase()

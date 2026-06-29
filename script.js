/* ===== WINLERR LANDING PAGE — SCRIPT ===== */

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== MOBILE HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('.nav-link, .nav-cta-btn').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

// ===== MODAL SYSTEM =====
function openModal(name) {
  const el = document.getElementById('modal-' + name);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(name) {
  const el = document.getElementById('modal-' + name);
  if (el) {
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeModalOutside(e, name) {
  if (e.target === e.currentTarget) closeModal(name);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ===== STORAGE HELPERS (fallback only) =====
function saveToLocal(key, data) {
  try {
    const list = JSON.parse(localStorage.getItem(key)) || []
    list.push({ ...data, _backup: true, _savedAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(list))
  } catch (e) {
    console.warn('[Winlerr] localStorage fallback failed:', e)
  }
}

// ===== FORM HELPERS =====
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId)
  if (!btn) return
  if (loading) {
    btn._orig = btn.innerHTML
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'
    btn.disabled = true
  } else {
    btn.innerHTML = btn._orig || btn.innerHTML
    btn.disabled = false
  }
}

function showSuccess(elId) {
  const el = document.getElementById(elId)
  if (el) el.style.display = 'flex'
}

function hideSuccess(elId) {
  const el = document.getElementById(elId)
  if (el) el.style.display = 'none'
}

function showError(elId, message) {
  const el = document.getElementById(elId)
  if (el) {
    el.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + message
    el.style.display = 'flex'
    el.style.background = 'rgba(239,68,68,.08)'
    el.style.borderColor = 'rgba(239,68,68,.2)'
    el.style.color = '#EF4444'
  }
}

function hideAllSuccess() {
  ['waitlistSuccess','prototypeSuccess','suggestSuccess','suggestModalSuccess'].forEach(hideSuccess)
}

// ===== WAITLIST FORM =====
async function submitWaitlist(e) {
  e.preventDefault()
  hideAllSuccess()
  setLoading('wlSubmitBtn', true)

  const data = {
    fullName: document.getElementById('wlName').value.trim(),
    email: document.getElementById('wlEmail').value.trim(),
    whatsapp: document.getElementById('wlWhatsapp').value.trim(),
    businessName: document.getElementById('wlBusiness').value.trim(),
    country: document.getElementById('wlCountry').value,
    businessType: document.getElementById('wlType').value,
    hasWebsite: document.querySelector('input[name="wlWebsite"]:checked')?.value || '',
    mainGoal: document.getElementById('wlGoal').value,
    emailConsent: document.getElementById('wlConsent')?.checked || false,
  }

  if (!window.WinlerrDB) {
    saveToLocal('winlerr_waitlist_fallback', data)
    showSuccess('waitlistSuccess')
    document.getElementById('waitlistForm').reset()
    setLoading('wlSubmitBtn', false)
    return
  }

  const { error } = await window.WinlerrDB.insertWaitlistLead(data)

  if (error) {
    console.warn('[Winlerr] Waitlist insert failed, saving locally:', error)
    saveToLocal('winlerr_waitlist_fallback', data)
    showSuccess('waitlistSuccess')
  } else {
    showSuccess('waitlistSuccess')
    // Attempt to add to Resend (non-blocking)
    if (data.email && data.emailConsent) {
      window.WinlerrDB.callResendApi('addContact', {
        email: data.email,
        fullName: data.fullName,
      }).catch(() => {})
      window.WinlerrDB.callResendApi('sendWelcome', {
        email: data.email,
        fullName: data.fullName,
      }).catch(() => {})
    }
  }

  document.getElementById('waitlistForm').reset()
  setLoading('wlSubmitBtn', false)
}

// ===== PROTOTYPE FORM =====
async function submitPrototype(e) {
  e.preventDefault()
  hideAllSuccess()
  setLoading('protoSubmitBtn', true)

  const actions = [...document.querySelectorAll('input[name="protoAction"]:checked')].map(c => c.value)

  const data = {
    fullName: document.getElementById('protoName').value.trim(),
    email: document.getElementById('protoEmail').value.trim(),
    whatsapp: document.getElementById('protoWhatsapp').value.trim(),
    businessName: document.getElementById('protoBusiness').value.trim(),
    industry: document.getElementById('protoIndustry').value.trim(),
    country: document.getElementById('protoCountry').value,
    existingWebsite: document.getElementById('protoWebsiteLink').value.trim(),
    socialLinks: document.getElementById('protoSocialLinks').value.trim(),
    prototypeType: document.getElementById('protoType').value,
    businessDescription: document.getElementById('protoDesc').value.trim(),
    customerActions: actions,
    brandStyle: document.getElementById('protoStyle').value,
    emailConsent: document.getElementById('protoConsent')?.checked || false,
  }

  if (!window.WinlerrDB) {
    saveToLocal('winlerr_prototypes_fallback', data)
    showSuccess('prototypeSuccess')
    document.getElementById('prototypeForm').reset()
    setLoading('protoSubmitBtn', false)
    return
  }

  const { error } = await window.WinlerrDB.insertPrototypeRequest(data)

  if (error) {
    console.warn('[Winlerr] Prototype insert failed, saving locally:', error)
    saveToLocal('winlerr_prototypes_fallback', data)
  }

  showSuccess('prototypeSuccess')

  // Notify admin (non-blocking)
  if (!error) {
    window.WinlerrDB.callResendApi('adminNotify', {
      type: 'prototype',
      data: { ...data, fullName: data.fullName, businessName: data.businessName },
    }).catch(() => {})
  }

  document.getElementById('prototypeForm').reset()
  setLoading('protoSubmitBtn', false)
}

// ===== SUGGEST FORM (inline) =====
async function submitSuggest(e) {
  e.preventDefault()
  hideAllSuccess()
  setLoading('suggestSubmitBtn', true)

  const data = {
    fullName: document.getElementById('suggestName').value.trim(),
    businessName: document.getElementById('suggestBusiness').value.trim(),
    email: document.getElementById('suggestEmail').value.trim(),
    whatsapp: document.getElementById('suggestWhatsapp').value.trim(),
    feature: document.getElementById('suggestFeature').value.trim(),
    reason: document.getElementById('suggestWhy').value.trim(),
    emailConsent: document.getElementById('suggestConsent')?.checked || false,
  }

  if (!window.WinlerrDB) {
    saveToLocal('winlerr_suggestions_fallback', data)
    showSuccess('suggestSuccess')
    document.getElementById('suggestForm').reset()
    setLoading('suggestSubmitBtn', false)
    return
  }

  const { error } = await window.WinlerrDB.insertFeatureSuggestion(data)

  if (error) {
    console.warn('[Winlerr] Suggestion insert failed, saving locally:', error)
    saveToLocal('winlerr_suggestions_fallback', data)
  }

  showSuccess('suggestSuccess')

  if (!error) {
    window.WinlerrDB.callResendApi('adminNotify', {
      type: 'suggestion',
      data,
    }).catch(() => {})
  }

  document.getElementById('suggestForm').reset()
  setLoading('suggestSubmitBtn', false)
}

// ===== SUGGEST FORM (modal) =====
async function submitSuggestModal(e) {
  e.preventDefault()
  hideAllSuccess()
  setLoading('sugModalSubmitBtn', true)

  const data = {
    fullName: document.getElementById('sugName').value.trim(),
    businessName: document.getElementById('sugBusiness').value.trim(),
    email: document.getElementById('sugEmail').value.trim(),
    whatsapp: document.getElementById('sugWhatsapp').value.trim(),
    feature: document.getElementById('sugFeature').value.trim(),
    reason: document.getElementById('sugWhy').value.trim(),
    emailConsent: document.getElementById('sugModalConsent')?.checked || false,
  }

  if (!window.WinlerrDB) {
    saveToLocal('winlerr_suggestions_fallback', data)
    showSuccess('suggestModalSuccess')
    document.getElementById('suggestModalForm').reset()
    setLoading('sugModalSubmitBtn', false)
    setTimeout(() => closeModal('suggest'), 3000)
    return
  }

  const { error } = await window.WinlerrDB.insertFeatureSuggestion(data)

  if (error) {
    console.warn('[Winlerr] Suggestion insert failed, saving locally:', error)
    saveToLocal('winlerr_suggestions_fallback', data)
  }

  showSuccess('suggestModalSuccess')

  document.getElementById('suggestModalForm').reset()
  setLoading('sugModalSubmitBtn', false)
  setTimeout(() => closeModal('suggest'), 3000)
}

// ===== COUNTER ANIMATION (trust section) =====
function animateCounters() {
  document.querySelectorAll('.stat-number[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'))
    const duration = 1500
    const start = performance.now()
    function update(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.floor(eased * target) + (target > 1 ? '+' : '')
      if (progress < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  })
}

const trustSection = document.getElementById('trust')
let countersTriggered = false
if (trustSection) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersTriggered) {
        countersTriggered = true
        animateCounters()
      }
    })
  }, { threshold: .4 })
  observer.observe(trustSection)
}

// ===== HERO COUNTER ANIMATION =====
function animateHeroCounters() {
  document.querySelectorAll('.hero-count[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'))
    const duration = 1200
    const start = performance.now()
    function update(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.floor(eased * target)
      if (progress < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  })

  document.querySelectorAll('.hero-bar-label[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'))
    const duration = 1200
    const start = performance.now()
    function update(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.floor(eased * target)
      if (progress < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  })

  const bar = document.querySelector('.mockup-bar-fill[data-bar]')
  if (bar) {
    const target = parseInt(bar.getAttribute('data-bar'))
    const duration = 1200
    const start = performance.now()
    function update(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      bar.style.width = Math.floor(eased * target) + '%'
      if (progress < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }
}

const heroVisual = document.querySelector('.hero-visual')
let heroAnimated = false
if (heroVisual) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !heroAnimated) {
        heroAnimated = true
        animateHeroCounters()
      }
    })
  }, { threshold: .3 })
  observer.observe(heroVisual)
}

window.addEventListener('load', () => {
  if (!heroAnimated && heroVisual && heroVisual.getBoundingClientRect().top < window.innerHeight) {
    heroAnimated = true
    setTimeout(animateHeroCounters, 400)
  }
})

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'))
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

// ===== EXPOSE GLOBALLY =====
window.submitWaitlist = submitWaitlist
window.submitPrototype = submitPrototype
window.submitSuggest = submitSuggest
window.submitSuggestModal = submitSuggestModal
window.openModal = openModal
window.closeModal = closeModal
window.closeModalOutside = closeModalOutside

/* ============================================================
   BOBtheBAGEL — js/utils.js
   Helpers · Formatters · Toast · Render · Logs
   ============================================================ */

import { A, sv } from './state.js';

// bApp est injecté après init pour éviter la dépendance circulaire utils ↔ router
let _bApp = null;
export function setBApp(fn) { _bApp = fn; }

// ── IDs ────────────────────────────────────────────────────
/**
 * Génère un ID unique. Utilise crypto.randomUUID() si disponible
 * pour éviter les collisions en multi-utilisateur.
 */
export function gId(prefix = 'C') {
  const uid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().split('-')[0].toUpperCase()
    : Date.now().toString(36).toUpperCase();
  return `${prefix}-${uid}`;
}

// ── Formatters date / heure ─────────────────────────────────
export function nISO() { return new Date().toISOString(); }

export function fD(s) {
  try { return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
  catch { return s || ''; }
}

export function fT(s) {
  try { return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export function fDl(d) {
  try { return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return d || ''; }
}

/** Retourne la date de demain au format YYYY-MM-DD */
export function dDel() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/** Valide qu'une date de livraison n'est pas dans le passé */
export function isValidDelivery(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

// ── Strings ────────────────────────────────────────────────
export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ── Produits ───────────────────────────────────────────────
export function gP(id) {
  return A.products.find(p => p.id === id);
}

export function aP() {
  return A.products.filter(p => p.active);
}

export function oCats() {
  return ['PAINS','VIANDES & POISSONS','CRUDITÉS','FROMAGES & CREAM CHEESE','SAUCES','DESSERTS','BOISSONS']
    .filter(c => aP().some(p => p.cat === c));
}

// ── Toasts ─────────────────────────────────────────────────
export function toast(msg, type = 'success') {
  const id = Date.now() + Math.random();
  A.toasts.push({ id, msg, type });
  rToasts();
  setTimeout(() => {
    A.toasts = A.toasts.filter(t => t.id !== id);
    rToasts();
  }, 3000);
}

function rToasts() {
  const el = document.getElementById('toasts');
  if (el) {
    el.innerHTML = A.toasts
      .map(t => `<div class="ti toast${t.type ? ' ' + t.type : ''}">${t.msg}</div>`)
      .join('');
  }
}

// ── Logs ───────────────────────────────────────────────────
export function alog(action) {
  A.aLog = [{ action, user: A.cUser?.name || '?', time: nISO() }, ...A.aLog].slice(0, 200);
  sv('al', A.aLog);
}

// ── Render ─────────────────────────────────────────────────
/**
 * Re-render complet de l'app.
 * ⚠️ DETTE TECHNIQUE : reconstruit tout le DOM.
 * En production Supabase, migrer vers un vrai framework
 * ou une stratégie de mise à jour partielle du DOM.
 */
export function render() {
  const app = document.getElementById('app');
  if (app && _bApp) app.innerHTML = _bApp();
  document.body.classList.toggle('dark', A.dark);
  updateBanner();
}

function updateBanner() {
  const existing = document.getElementById('global-banner');
  if (existing) existing.remove();
  if (A.banner) {
    const b = document.createElement('div');
    b.id = 'global-banner';
    b.style.cssText = [
      'background:var(--yl)',
      'color:#000',
      'padding:8px 16px',
      'text-align:center',
      "font-family:'Barlow Condensed',sans-serif",
      'font-weight:900',
      'font-size:13px',
      'letter-spacing:2px',
      'position:sticky',
      'top:0',
      'z-index:100',
    ].join(';');
    b.textContent = A.banner;
    // Insère après le header s'il existe, sinon en haut du body
    const hdr = document.querySelector('.hdr');
    if (hdr) hdr.insertAdjacentElement('afterend', b);
    else document.body.prepend(b);
  }
}

// ── Section catégorie (séparateur visuel) ──────────────────
export function cSec(cat) {
  const { CATEGORY_ICONS } = window.__BOB__ || {};
  const icon = (CATEGORY_ICONS || {})[cat] || '📦';
  return `
    <div class="cath">
      <div class="cathl"></div>
      <div class="catht">${icon} ${cat}</div>
      <div class="cathl"></div>
    </div>`;
}

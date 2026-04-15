/* ============================================================
   BOBtheBAGEL — js/router.js
   Routing principal · bApp · Navigation
   ============================================================ */

import { A, SHOPS }            from './state.js';
import { dDel, render, setBApp } from './utils.js';
import { isAdmin, canAccessKitchen } from './auth.js';
import { bLogin }        from './views/login.js';
import { bSelect }       from './views/select.js';
import { bShop }         from './views/shop.js';
import { bKitchen }      from './views/kitchen.js';
import { bAdmin }        from './views/admin.js';
import { bChat }         from './views/chat.js';
import { bCfm }          from './views/modals.js';

// ── Router principal ───────────────────────────────────────
// Injecte bApp dans utils pour éviter la dépendance circulaire
setBApp(() => bApp());

export function bApp() {
  let content = '';

  switch (A.view) {
    case 'login':   content = bLogin();   break;
    case 'select':  content = bSelect();  break;
    case 'shop':    content = bShop();    break;
    case 'kitchen': content = bKitchen(); break;
    case 'admin':   content = bAdmin();   break;
    case 'chat':    content = bChat();    break;
    default:        content = bLogin();
  }

  const modal = A.confirm ? bCfm() : '';
  return content + modal;
}

// ── Navigation ─────────────────────────────────────────────
export function goSel() { A.view = 'select'; render(); }

export function goShop(id) {
  const sh = SHOPS.find(s => s.id === id);
  if (!sh) return;

  A.selShop = sh;
  A.sTab    = 'order';
  A.cart    = {};
  A.note    = '';
  A.search  = '';
  A.del     = dDel();
  A.delT    = '';

  // Marquer comme vus
  const ns = { ...A.seen };
  A.orders.filter(o => o.shopId === id).forEach(o => { ns[o.id] = true; });
  A.ksends.filter(k => k.shopId === id).forEach(k => { ns[k.id] = true; });
  A.seen = ns;
  import('./state.js').then(({ sv }) => sv('sn', ns));

  A.view = 'shop';
  render();
}

export function switchShop(id) { goShop(id); }

export function goKit() {
  if (!canAccessKitchen()) return;
  A.kTab = 'orders';
  A.view = 'kitchen';
  render();
}

export function goAdm() {
  if (!isAdmin()) return;
  A.admTab = 'banner';
  A.view   = 'admin';
  render();
}

// ── Tabs ───────────────────────────────────────────────────
export function sSTb(t)  { A.sTab  = t; render(); }
export function sKTb(t)  { A.kTab  = t; render(); }
export function sSCat(c) { A.sCat  = c; render(); }
export function sRCat(c) { A.rcCat = c; render(); }
export function sSch(v)  { A.search = v; render(); }

// ── Préférences ────────────────────────────────────────────
export function setLang(l) {
  A.lang = l;
  import('./state.js').then(({ sv }) => sv('lg', l));
  render();
}

export function toggleDark() {
  A.dark = !A.dark;
  import('./state.js').then(({ sv }) => sv('dk', A.dark));
  render();
}

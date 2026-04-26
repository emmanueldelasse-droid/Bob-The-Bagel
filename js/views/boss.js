/* ============================================================
   BOBtheBAGEL — views/boss.js
   Cockpit Boss : vue d'ensemble multi-boutiques + activité managers
   + accès complet aux outils admin
   ============================================================ */

import { A, ORDER_STATUSES } from '../state.js';
import { fD, fT, fDl } from '../utils.js';
import { bAuditSection } from './audit.js';

const STATUS_LABELS = {
  pending:    'En attente',
  preparing:  'Préparation',
  delivering: 'Livraison',
  validated:  'Validée',
  received:   'Reçue',
  rejected:   'Refusée',
};

// ── Helpers ────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function isToday(iso) {
  if (!iso) return false;
  return new Date(iso).toISOString().split('T')[0] === todayISO();
}

function ordersForShop(shopId) {
  return (A.orders || []).filter((o) => o.shopId === shopId);
}

function todayOrdersForShop(shopId) {
  return ordersForShop(shopId).filter((o) => isToday(o.createdAt));
}

function lowStockCount(entityId) {
  const stock = A.stock?.[entityId] || {};
  return Object.values(stock).filter((s) => Number(s?.qty || 0) <= Number(s?.alert || 0)).length;
}

function totalStockItems(entityId) {
  return Object.keys(A.stock?.[entityId] || {}).length;
}

function lastAuditForShop(shopId) {
  const audits = (A.audits || []).filter((a) => a.shopId === shopId && a.status !== 'draft');
  if (!audits.length) return null;
  return audits.slice().sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt))[0];
}

function openOrdersCount() {
  return (A.orders || []).filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'delivering').length;
}

function managers() {
  return (A.users || []).filter((u) => u.role === 'admin' || u.role === 'boss');
}

// ── Header ─────────────────────────────────────────────────
function bossHeader() {
  return `
    <div class="hdr" style="background:linear-gradient(135deg,#1a1a1a 0%,#2a1a3a 100%);color:#fff">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;letter-spacing:2px;color:#E8B84B">★ COCKPIT BOSS</div>
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="window.__BOB__.goSel()"
          style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);height:30px;padding:0 12px;border-radius:6px;color:#fff;font-size:11px;font-family:'Space Grotesk',sans-serif;font-weight:600;cursor:pointer">
          Espaces
        </button>
        <button onclick="window.__BOB__.goAdm()"
          style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);height:30px;padding:0 12px;border-radius:6px;color:#fff;font-size:11px;font-family:'Space Grotesk',sans-serif;font-weight:600;cursor:pointer">
          Outils admin
        </button>
        <button onclick="window.__BOB__.toggleDark()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);width:32px;height:32px;border-radius:6px;color:#fff;font-size:14px;cursor:pointer">◑</button>
        <button onclick="window.__BOB__.logout()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);width:32px;height:32px;border-radius:6px;color:#fff;font-size:14px;cursor:pointer">↩</button>
      </div>
    </div>`;
}

// ── KPI bar ────────────────────────────────────────────────
function kpiBar() {
  const shopsCount = (A.shops || []).length;
  const totalOrdersToday = (A.orders || []).filter((o) => isToday(o.createdAt)).length;
  const openOrders = openOrdersCount();
  const kitchenLow = lowStockCount('kitchen');

  const cell = (label, value, color) => `
    <div style="flex:1;min-width:140px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px">
      <div class="label" style="font-size:9px;color:var(--txt3);margin-bottom:6px">${label}</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:24px;color:${color || 'var(--txt)'};letter-spacing:-.5px">${value}</div>
    </div>`;

  return `
    <div style="display:flex;gap:10px;flex-wrap:wrap;padding:14px 14px 0">
      ${cell('Boutiques actives', shopsCount, 'var(--blue)')}
      ${cell('Commandes aujourd\\'hui', totalOrdersToday, 'var(--txt)')}
      ${cell('Commandes ouvertes', openOrders, openOrders > 0 ? 'var(--amber)' : 'var(--green)')}
      ${cell('Alertes stock cuisine', kitchenLow, kitchenLow > 0 ? 'var(--red)' : 'var(--green)')}
    </div>`;
}

// ── Carte par boutique ─────────────────────────────────────
function shopCard(sh) {
  const todayOrders = todayOrdersForShop(sh.id);
  const todayCount = todayOrders.length;
  const pending = todayOrders.filter((o) => o.status === 'pending').length;
  const validated = todayOrders.filter((o) => o.status === 'validated' || o.status === 'received').length;
  const low = lowStockCount(sh.id);
  const total = totalStockItems(sh.id);
  const audit = lastAuditForShop(sh.id);
  const auditScore = audit?.score;
  const auditDate = audit?.completedAt || audit?.createdAt;

  const auditBadge = audit
    ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${auditScore === 'OK' ? '#D1FAE5' : '#FEE2E2'};color:${auditScore === 'OK' ? '#1A7A4A' : '#E8294B'}">${auditScore === 'OK' ? '✓ OK' : '✗ KO'} · ${fD(auditDate)}</span>`
    : `<span style="font-size:10px;color:var(--txt3)">aucun audit</span>`;

  return `
    <div style="background:var(--bg2);border:1px solid var(--border);border-left:4px solid ${sh.color};border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;letter-spacing:.5px;color:var(--txt)">${sh.name}</div>
        <button onclick="window.__BOB__.goShop('${sh.id}')"
          style="background:transparent;border:1px solid var(--border);height:24px;padding:0 10px;border-radius:6px;color:var(--txt2);font-size:10px;font-family:'Space Grotesk',sans-serif;font-weight:600;cursor:pointer">
          Ouvrir →
        </button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div>
          <div style="font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Cmds jour</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;color:var(--txt)">${todayCount}</div>
          ${todayCount > 0 ? `<div style="font-size:10px;color:var(--txt2);margin-top:2px">${pending} en attente · ${validated} validées</div>` : ''}
        </div>
        <div>
          <div style="font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Stock</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;color:${low > 0 ? 'var(--red)' : 'var(--txt)'}">${low}/${total}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">${low > 0 ? 'alerte' + (low > 1 ? 's' : '') : 'sain'}</div>
        </div>
        <div>
          <div style="font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Dernier audit</div>
          <div style="margin-top:2px">${auditBadge}</div>
        </div>
      </div>
    </div>`;
}

// ── Section Cuisine centrale ───────────────────────────────
function kitchenCard() {
  const open = openOrdersCount();
  const low = lowStockCount('kitchen');
  const total = totalStockItems('kitchen');

  return `
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2a1a0a 100%);color:#fff;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;letter-spacing:.5px;color:#E8B84B">⚡ CUISINE CENTRALE</div>
        <button onclick="window.__BOB__.goKit()"
          style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);height:24px;padding:0 10px;border-radius:6px;color:#fff;font-size:10px;font-family:'Space Grotesk',sans-serif;font-weight:600;cursor:pointer">
          Ouvrir →
        </button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        <div>
          <div style="font-size:9px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Cmds ouvertes</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:22px;color:${open > 0 ? '#E8B84B' : '#86EFAC'}">${open}</div>
        </div>
        <div>
          <div style="font-size:9px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Alertes stock</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:22px;color:${low > 0 ? '#FCA5A5' : '#86EFAC'}">${low}/${total}</div>
        </div>
      </div>
    </div>`;
}

// ── Activité des managers ──────────────────────────────────
function managersActivity() {
  const mgrs = managers();
  if (!mgrs.length) {
    return `<div style="padding:14px 16px;color:var(--txt2);font-size:13px">Aucun manager enregistré.</div>`;
  }

  const rows = mgrs.map((m) => {
    const lastConn = (A.cLog || []).find((e) => (e.user || '').includes(m.name));
    const actionsCount = (A.aLog || []).filter((e) => (e.user || '').includes(m.name)).length;
    const roleColor = m.role === 'boss' ? '#E8294B' : '#1A7A4A';
    const roleLabel = m.role === 'boss' ? 'BOSS' : 'MANAGER';

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
          <div style="width:36px;height:36px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--txt);font-weight:700;font-size:14px;flex-shrink:0">${m.name[0]}</div>
          <div style="min-width:0;flex:1">
            <div style="font-weight:600;font-size:13px;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.name}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:2px;flex-wrap:wrap">
              <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:1px;color:${roleColor}">${roleLabel}</span>
              <span style="font-size:10px;color:var(--txt3)">${actionsCount} action${actionsCount > 1 ? 's' : ''}</span>
              ${lastConn ? `<span style="font-size:10px;color:var(--txt3)">· dernière connexion ${fD(lastConn.time)} ${fT(lastConn.time)}</span>` : `<span style="font-size:10px;color:var(--txt3)">· jamais connecté</span>`}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  return rows;
}

function recentActions() {
  const actions = (A.aLog || []).slice(0, 20);
  if (!actions.length) {
    return `<div style="padding:14px 16px;color:var(--txt2);font-size:13px">Aucune action enregistrée.</div>`;
  }
  return actions.map((e) => `
    <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);gap:12px">
      <span style="font-size:12px;color:var(--txt);flex:1;min-width:0">${e.action} <span style="color:var(--txt3)">(${e.user})</span></span>
      <span style="font-size:11px;color:var(--txt3);white-space:nowrap;flex-shrink:0">${fD(e.time)} ${fT(e.time)}</span>
    </div>
  `).join('');
}

// ── Vue principale ─────────────────────────────────────────
export function bBoss() {
  const tab = A.bossTab || 'overview';

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: '◉' },
    { id: 'managers', label: 'Activité managers', icon: '◐' },
    { id: 'audit',    label: 'Audits',           icon: '◑' },
    { id: 'log',      label: 'Journal',          icon: '◒' },
  ];

  let content = '';
  switch (tab) {
    case 'overview':
      content = `
        ${kpiBar()}
        <div style="padding:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
          ${(A.shops || []).map(shopCard).join('')}
          ${kitchenCard()}
        </div>`;
      break;

    case 'managers':
      content = `
        <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt);margin-bottom:4px">Managers et Boss</div>
          <div style="font-size:12px;color:var(--txt2)">Vue d'ensemble des comptes à privilèges élevés et de leur activité.</div>
        </div>
        ${managersActivity()}
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);margin-top:18px">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt);margin-bottom:4px">Actions récentes (toutes équipes)</div>
          <div style="font-size:12px;color:var(--txt2)">Les 20 dernières actions tracées dans l'app.</div>
        </div>
        ${recentActions()}`;
      break;

    case 'audit':
      content = bAuditSection();
      break;

    case 'log':
      content = `
        <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt);margin-bottom:4px">Connexions récentes</div>
        </div>
        ${(A.cLog || []).slice(0, 30).map((e) => `
          <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border)">
            <span style="font-weight:600;font-size:13px;color:var(--txt)">${e.user}</span>
            <span style="font-size:11px;color:var(--txt3)">${fD(e.time)} ${fT(e.time)}</span>
          </div>
        `).join('') || '<div style="padding:14px 16px;color:var(--txt2);font-size:13px">Aucune connexion enregistrée.</div>'}`;
      break;
  }

  return `
    <div class="page">
      ${bossHeader()}
      <div class="tabs" style="background:var(--bg2)">
        ${tabs.map((t) => `
          <button class="tab${tab === t.id ? ' on' : ''}" onclick="window.__BOB__.setBossTab('${t.id}')" style="font-size:12px">
            ${t.icon} ${t.label}
          </button>
        `).join('')}
      </div>
      <div class="main fade">${content}</div>
    </div>`;
}

export function setBossTab(t) {
  A.bossTab = t;
  import('../utils.js').then(({ render }) => render());
}

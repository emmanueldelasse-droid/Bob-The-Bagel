/* ============================================================
   BOBtheBAGEL — views/shop.js v3
   Réécriture complète — layout produit compact
   ============================================================ */

import { A, ORDER_STATUSES, ROLE_LABELS } from '../state.js';
import { aP, oCats, gP, fD, fT, fDl } from '../utils.js';
import { isAdmin } from '../auth.js';
import { bSum } from './modals.js';
import { bChat, chatBadge } from './chat.js';
import { bCalendar, calBadge, calDashboardWidget } from './calendar.js';
import { bAuditSection } from './audit.js';
import { bPlanningSection } from './planning.js';
import { totalUnread } from '../modules/chat.js';
import { getLowStock, stockLevel } from '../modules/stock.js';
import { unseenCountForUser } from '../modules/notifications.js';

function receptionBadge() {
  const sh = A.selShop;
  if (!sh) return '';
  const n = A.orders.filter((o) => o.shopId === sh.id && (o.status === 'validated' || o.status === 'delivering')).length;
  if (n === 0) return '';
  return `<span style="background:var(--amber);color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:10px;margin-left:4px;vertical-align:middle">${n > 9 ? '9+' : n}</span>`;
}

function runtimePanel({ kind = 'info', title, text, meta = '' }) {
  const tones = {
    info: {
      bg: A.dark ? '#1C2433' : '#EFF6FF',
      border: A.dark ? '#2E4C77' : '#BFDBFE',
      color: A.dark ? '#BFDBFE' : '#1D4ED8',
      icon: '⏳',
    },
    warn: {
      bg: A.dark ? '#2D1B00' : '#FFF7ED',
      border: A.dark ? '#7C4A03' : '#FED7AA',
      color: A.dark ? '#FCD34D' : '#9A3412',
      icon: '⚠️',
    },
    ok: {
      bg: A.dark ? '#10261A' : '#ECFDF5',
      border: A.dark ? '#1F5C3A' : '#BBF7D0',
      color: A.dark ? '#86EFAC' : '#166534',
      icon: '✓',
    },
  };
  const tone = tones[kind] || tones.info;

  return `
    <div style="background:${tone.bg};border:1px solid ${tone.border};border-radius:8px;padding:10px 12px;margin:0 14px 12px;color:${tone.color}">
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="font-size:14px;line-height:1.2">${tone.icon}</div>
        <div style="min-width:0">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;letter-spacing:.2px">${title}</div>
          <div style="font-size:12px;line-height:1.45;margin-top:2px">${text}</div>
          ${meta ? `<div style="font-size:11px;opacity:.85;margin-top:4px">${meta}</div>` : ''}
        </div>
      </div>
    </div>`;
}

function ordersRuntimeNotice() {
  const r = A.runtime || {};
  if (r.ordersLoading && !r.ordersHydrated) {
    return runtimePanel({
      kind: 'info',
      title: 'Chargement des commandes',
      text: 'Les commandes sont en cours de synchronisation avec la base.',
    });
  }
  if (r.ordersError) {
    return runtimePanel({
      kind: 'warn',
      title: 'Synchronisation commandes incomplète',
      text: r.ordersError,
      meta: r.lastOrdersSyncAt ? `Dernière synchro OK : ${fD(r.lastOrdersSyncAt)} · ${fT(r.lastOrdersSyncAt)}` : 'Aucune synchro confirmée pour le moment.',
    });
  }
  if (r.ordersHydrated && r.lastOrdersSyncAt) {
    return runtimePanel({
      kind: 'ok',
      title: 'Commandes synchronisées',
      text: 'La vue commandes utilise les données Supabase.',
      meta: `Dernière synchro : ${fD(r.lastOrdersSyncAt)} · ${fT(r.lastOrdersSyncAt)}`,
    });
  }
  return '';
}

function stockRuntimeNotice() {
  const r = A.runtime || {};
  if (r.stockLoading && !r.stockHydrated) {
    return runtimePanel({
      kind: 'info',
      title: 'Chargement du stock',
      text: 'Le stock de la boutique est en cours de synchronisation avec la base.',
    });
  }
  if (r.stockError) {
    return runtimePanel({
      kind: 'warn',
      title: 'Synchronisation stock incomplète',
      text: r.stockError,
      meta: r.lastStockSyncAt ? `Dernière synchro OK : ${fD(r.lastStockSyncAt)} · ${fT(r.lastStockSyncAt)}` : 'Aucune synchro confirmée pour le moment.',
    });
  }
  if (r.stockHydrated && r.lastStockSyncAt) {
    return runtimePanel({
      kind: 'ok',
      title: 'Stock synchronisé',
      text: 'Les niveaux affichés proviennent de Supabase.',
      meta: `Dernière synchro : ${fD(r.lastStockSyncAt)} · ${fT(r.lastStockSyncAt)}`,
    });
  }
  return '';
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────
function shopHeader() {
  const sh = A.selShop;
  return `
    <div style="background:var(--bg2);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:30">

      <!-- Barre principale -->
      <div style="height:48px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <button onclick="window.__BOB__.goSel()" style="height:30px;padding:0 10px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--txt2);font-size:12px;font-family:'Space Grotesk',sans-serif;font-weight:600;cursor:pointer">← Retour</button>
          <div style="display:flex;align-items:baseline;gap:1px;line-height:1;user-select:none">
            <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--txt);letter-spacing:-1px;font-size:18px">BOB</span>
            <span style="font-family:'Dancing Script',cursive;font-weight:700;color:var(--red);font-size:15px;margin:0 2px">the</span>
            <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--txt);letter-spacing:-1px;font-size:18px">BAGEL</span>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          ${(() => {
            const n = unseenCountForUser(A.cUser);
            return `
              <button onclick="window.__BOB__.toggleNotifs()" style="position:relative;width:30px;height:30px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--txt2);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center">
                🔔
                ${n > 0 ? `<span style="position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:8px;display:flex;align-items:center;justify-content:center;line-height:1">${n > 9 ? '9+' : n}</span>` : ''}
              </button>`;
          })()}
          ${isAdmin() ? `<button onclick="window.__BOB__.goAdm()" style="width:30px;height:30px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--txt2);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center">⚙</button>` : ''}
          <button onclick="window.__BOB__.toggleDark()" style="width:30px;height:30px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--txt2);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center">◑</button>
          <button onclick="window.__BOB__.logout()" style="width:30px;height:30px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--txt2);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center">↩</button>
        </div>
      </div>

      <!-- Switch boutiques (si plusieurs) -->
      ${(A.shops || []).length > 1 ? `
        <div style="padding:6px 14px;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--border)">
          ${(A.shops || []).map(s => `
            <button onclick="window.__BOB__.switchShop('${s.id}')"
              style="
                height:28px;padding:0 12px;border-radius:20px;border:1.5px solid ${s.color};
                background:${A.selShop?.id === s.id ? s.color : 'transparent'};
                color:${A.selShop?.id === s.id ? '#fff' : s.color};
                font-family:'Syne',sans-serif;font-weight:700;font-size:11px;
                white-space:nowrap;cursor:pointer;letter-spacing:.3px;transition:all .12s
              ">${s.name}</button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Nom boutique -->
      <div style="background:${sh?.color || '#1A7A4A'};padding:8px 14px">
        <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#fff">${sh?.name || ''}</span>
      </div>

    </div>`;
}

// ─────────────────────────────────────────────────────────────
// LIGNE PRODUIT — compact, nom et boutons proches
// ─────────────────────────────────────────────────────────────
function productRow(p, sh) {
  const qty   = A.cart[p.id] || 0;
  const hasQ  = qty > 0;
  const level = sh ? stockLevel(sh.id, p.id) : 'ok';
  const stock = sh ? (A.stock[sh.id]?.[p.id]?.qty ?? '—') : null;

  const rowBg   = hasQ ? 'var(--lgreen)' : 'var(--bg2)';
  const bdrColor = hasQ ? 'var(--green)' : 'var(--border)';
  const plusBg  = hasQ ? 'var(--green)' : 'var(--bg3)';
  const plusClr = hasQ ? '#fff' : 'var(--txt)';

  return `
    <div style="
      display:flex;
      align-items:center;
      padding:9px 14px;
      border-bottom:1px solid var(--border);
      background:${rowBg};
      gap:10px;
      transition:background .1s
    ">
      <div style="flex:1;min-width:0">
        <div style="
          font-family:'Space Grotesk',sans-serif;
          font-weight:600;
          font-size:13px;
          color:var(--txt);
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          display:flex;
          align-items:center;
          gap:5px
        ">
          ${p.name}
          ${level === 'low' ? '<span style="font-size:9px;color:var(--amber);font-weight:700;flex-shrink:0">⚠ bas</span>' : ''}
        </div>
        <div style="font-size:10px;color:var(--txt3);margin-top:1px;font-weight:500;white-space:nowrap">
          +${p.step} ${p.unit}${stock !== null ? ' · ' + stock + ' ' + p.unit : ''}
        </div>
      </div>

      <div style="
        display:flex;
        align-items:center;
        border:1.5px solid ${bdrColor};
        border-radius:7px;
        overflow:hidden;
        flex-shrink:0;
        transition:border-color .15s
      ">
        <button
          onclick="window.__BOB__.sCart('${p.id}',Math.max(0,(${qty})-${p.step}))"
          style="
            width:30px;height:32px;
            background:transparent;border:none;
            color:var(--txt);font-size:17px;font-weight:300;
            cursor:pointer;line-height:1;
            transition:background .1s
          "
          onmouseover="this.style.background='var(--bg3)'"
          onmouseout="this.style.background='transparent'"
        >−</button>

        <span style="
          width:38px;height:32px;
          display:flex;align-items:center;justify-content:center;
          font-family:'Syne',sans-serif;font-weight:700;font-size:13px;
          color:var(--txt);
          border-left:1px solid var(--border);
          border-right:1px solid var(--border);
          background:var(--bg2)
        ">${qty || 0}</span>

        <button
          onclick="window.__BOB__.qAdd('${p.id}')"
          style="
            width:30px;height:32px;
            background:${plusBg};border:none;
            color:${plusClr};font-size:17px;font-weight:300;
            cursor:pointer;line-height:1;
            transition:all .15s
          "
          onmouseover="this.style.opacity='.8'"
          onmouseout="this.style.opacity='1'"
        >+</button>
      </div>

    </div>`;
}

function tabOrder() {
  const cats      = oCats();
  const sh        = A.selShop;
  const cartItems = A.products.filter(p => p.active && (A.cart[p.id] || 0) > 0);
  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((n, p) => n + A.cart[p.id], 0);

  const today = new Date().toISOString().split('T')[0];

  return `
    <div style="padding-bottom:72px;max-width:720px;width:100%;margin:0 auto">
      ${calDashboardWidget()}

      <div style="
        padding:10px 14px;
        background:var(--bg2);
        border-bottom:1px solid var(--border);
        display:flex;
        flex-direction:column;
        gap:7px
      ">
        <input
          placeholder="Rechercher un produit…"
          value="${A.search || ''}"
          oninput="window.__BOB__.sSch(this.value)"
          style="
            width:100%;height:38px;
            padding:0 12px;
            border:1.5px solid var(--border);border-radius:6px;
            background:var(--bg);color:var(--txt);
            font-family:'Space Grotesk',sans-serif;font-size:13px;
            outline:none;transition:border-color .15s
          "
          onfocus="this.style.borderColor='var(--txt)'"
          onblur="this.style.borderColor='var(--border)'"
        />

        <div style="display:flex;align-items:center;gap:8px">
          <span style="
            font-family:'Syne',sans-serif;font-weight:700;
            font-size:10px;letter-spacing:1.5px;text-transform:uppercase;
            color:var(--txt3);white-space:nowrap;flex-shrink:0
          ">Livraison</span>
          <input
            type="date"
            value="${A.del}"
            min="${today}"
            onchange="window.__BOB__.sDel(this.value)"
            style="
              flex:1;height:34px;
              padding:0 10px;
              border:1.5px solid var(--border);border-radius:6px;
              background:var(--bg2);color:var(--txt);
              font-family:'Space Grotesk',sans-serif;font-size:13px;
              outline:none
            "
          />
          <input
            type="time"
            value="${A.delT}"
            onchange="window.__BOB__.sDelT(this.value)"
            style="
              width:100px;height:34px;
              padding:0 10px;
              border:1.5px solid var(--border);border-radius:6px;
              background:var(--bg2);color:var(--txt);
              font-family:'Space Grotesk',sans-serif;font-size:13px;
              outline:none;flex-shrink:0
            "
          />
        </div>
      </div>

      ${cats.map(cat => {
        const search = (A.search || '').toLowerCase();
        const prods  = aP().filter(p => p.cat === cat && (!search || p.name.toLowerCase().includes(search)));
        if (!prods.length) return '';

        const subs  = [...new Set(prods.map(p => p.sub).filter(Boolean))];
        const noSub = prods.filter(p => !p.sub);

        return `
          <div style="
            display:flex;align-items:center;gap:10px;
            padding:12px 14px 6px;
            background:var(--bg)
          ">
            <div style="flex:1;height:1px;background:var(--border)"></div>
            <span style="
              font-family:'Syne',sans-serif;font-weight:700;
              font-size:9px;letter-spacing:2.5px;text-transform:uppercase;
              color:var(--txt3);white-space:nowrap
            ">${cat}</span>
            <div style="flex:1;height:1px;background:var(--border)"></div>
          </div>

          ${noSub.map(p => productRow(p, sh)).join('')}

          ${subs.map(sub => `
            <div style="
              font-family:'Syne',sans-serif;font-weight:700;
              font-size:9px;letter-spacing:2px;text-transform:uppercase;
              color:var(--txt3);
              padding:7px 14px 4px;
              background:var(--bg3);
              border-bottom:1px solid var(--border)
            ">${sub}</div>
            ${prods.filter(p => p.sub === sub).map(p => productRow(p, sh)).join('')}
          `).join('')}
        `;
      }).join('')}

      <div style="padding:14px;border-top:1px solid var(--border);background:var(--bg2);margin-top:8px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:6px">
          Note opérationnelle
        </div>
        <textarea
          rows="3"
          placeholder="Urgences, précisions, remarques…"
          oninput="window.__BOB__.sNote(this.value)"
          style="
            width:100%;padding:10px 12px;
            border:1.5px solid var(--border);border-radius:6px;
            background:var(--bg2);color:var(--txt);
            font-family:'Space Grotesk',sans-serif;font-size:13px;
            resize:none;outline:none;line-height:1.5;
            transition:border-color .15s
          "
          onfocus="this.style.borderColor='var(--txt)'"
          onblur="this.style.borderColor='var(--border)'"
        >${A.note}</textarea>
      </div>

    </div>

    <div style="
      position:fixed;bottom:0;left:50%;transform:translateX(-50%);
      width:100%;max-width:720px;
      padding:10px 14px;
      background:var(--bg2);
      border-top:1px solid var(--border);
      z-index:20;
      box-sizing:border-box
    ">
      <button
        onclick="${cartCount > 0 ? 'window.__BOB__.oSum()' : ''}"
        style="
          width:100%;height:46px;
          border-radius:8px;border:none;
          background:${cartCount > 0 ? 'var(--txt)' : 'var(--border)'};
          color:${cartCount > 0 ? 'var(--bg2)' : 'var(--txt3)'};
          font-family:'Syne',sans-serif;font-weight:700;font-size:13px;
          letter-spacing:.5px;cursor:${cartCount > 0 ? 'pointer' : 'default'};
          display:flex;align-items:center;justify-content:${cartCount > 0 ? 'space-between' : 'center'};
          padding:0 18px;
          transition:all .15s
        "
      >
        <span>Envoyer la commande</span>
        ${cartCount > 0 ? `
          <span style="
            background:rgba(255,255,255,.15);
            border-radius:5px;padding:2px 10px;
            font-size:11px;font-weight:600
          ">${cartTotal} art.</span>
        ` : ''}
      </button>
    </div>

    ${A.summary ? bSum() : ''}`;
}

function tabOrders() {
  const sh = A.selShop;
  const orders = A.orders.filter(o => o.shopId === sh?.id);
  const notice = ordersRuntimeNotice();
  const loadingOnly = A.runtime.ordersLoading && !A.runtime.ordersHydrated;

  if (!orders.length && loadingOnly) {
    return `<div style="padding:14px;max-width:720px;width:100%;margin:0 auto">${notice}</div>`;
  }

  if (!orders.length) return `
    <div style="padding:14px;max-width:720px;width:100%;margin:0 auto">
      ${notice}
      <div style="padding:60px 20px;text-align:center">
        <div style="font-size:28px;margin-bottom:10px">📋</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt)">Aucune commande</div>
        <div style="font-size:13px;color:var(--txt2);margin-top:4px">Vos commandes apparaîtront ici.</div>
      </div>
    </div>`;

  return `
    <div style="padding:14px;max-width:720px;width:100%;margin:0 auto">
      ${notice}
      ${orders.map(o => {
        const st = ORDER_STATUSES[o.status] || {};
        const open = A['oO_' + o.id];

        return `
          <div style="
            background:var(--bg2);
            border:1px solid var(--border);
            border-left:3px solid ${st.dot || 'var(--border)'};
            border-radius:10px;
            margin-bottom:10px;
            overflow:hidden;
            box-shadow:var(--sh)
          ">
            <div
              onclick="window.__BOB__.tO('${o.id}')"
              style="padding:12px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;cursor:pointer"
            >
              <div style="min-width:0;flex:1">
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt)">${o.id}</div>
                <div style="font-size:11px;color:var(--txt2);margin-top:2px">${fD(o.createdAt)} · ${fT(o.createdAt)} · ${o.orderedBy}</div>
                <div style="font-size:11px;color:var(--txt2)">📦 ${fDl(o.delivery)}${o.deliveryTime ? ' · ⏰ ' + o.deliveryTime : ''}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
                <span style="
                  display:inline-flex;align-items:center;gap:5px;
                  font-size:11px;font-weight:600;
                  padding:3px 9px;border-radius:20px;
                  background:${st.dot}18;color:${st.dot}
                ">
                  <span style="width:6px;height:6px;border-radius:50%;background:${st.dot};flex-shrink:0"></span>
                  ${st.label}
                </span>
                <span style="font-size:11px;color:var(--txt3)">${open ? '▲' : '▼'}</span>
              </div>
            </div>

            ${open ? `
              <div style="border-top:1px solid var(--border);padding:12px 14px">
                ${(o.items || []).map(i => {
                  const p = gP(i.id);
                  return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
                      <span style="font-size:13px;color:var(--txt)">${p?.name || i.id}</span>
                      <span style="font-size:13px;font-weight:700;color:var(--txt)">${i.qty} <span style="color:var(--txt3);font-weight:400">${p?.unit}</span></span>
                    </div>`;
                }).join('')}

                ${o.note ? `<div style="margin-top:8px;padding:8px 10px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--txt2)">💬 ${o.note}</div>` : ''}
                ${o.comment ? `<div style="margin-top:6px;padding:8px 10px;background:${A.dark?'#1e2d47':'#EFF6FF'};border-radius:6px;font-size:12px;color:var(--blue)">🍳 ${o.comment}</div>` : ''}

                ${o.reservation ? `
                  <div style="margin-top:10px;padding:10px 12px;background:${A.dark ? '#2D1B00' : '#FFF7ED'};border:1px solid #FED7AA;border-radius:7px;color:${A.dark ? '#FCD34D' : '#92400E'};font-size:12px;line-height:1.5">
                    <div style="font-family:'Archivo Black',sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">⚠ Réserve émise</div>
                    <div>Par ${o.reservation.reportedBy} · ${fD(o.reservation.reportedAt)} ${fT(o.reservation.reportedAt)}</div>
                    ${(o.reservation.items || []).length ? `<div style="margin-top:4px">${o.reservation.items.map(it => { const p = gP(it.id); return `${p?.name || it.id} : ${it.actual}/${it.expected} ${p?.unit || ''}`; }).join(' · ')}</div>` : ''}
                    ${o.reservation.note ? `<div style="margin-top:4px;font-style:italic">« ${o.reservation.note} »</div>` : ''}
                  </div>
                ` : ''}

                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                  ${(o.status === 'validated' || o.status === 'delivering') ? `
                    <button
                      onclick="window.__BOB__.cfSRc('${o.id}')"
                      style="flex:1;height:40px;background:var(--green);color:#fff;border:none;border-radius:7px;font-family:'Archivo Black',sans-serif;font-weight:900;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px"
                    >Confirmer réception 📦</button>
                    <button
                      onclick="window.__BOB__.openReserveDraft('${o.id}')"
                      style="height:40px;padding:0 14px;background:transparent;color:var(--amber);border:1.5px solid var(--amber);border-radius:7px;font-family:'Archivo Black',sans-serif;font-weight:900;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px"
                    >⚠ Réserve</button>
                  ` : ''}
                  ${(o.status === 'received' && !o.reservation) ? `
                    <button
                      onclick="window.__BOB__.openReserveDraft('${o.id}')"
                      style="height:40px;padding:0 14px;background:transparent;color:var(--amber);border:1.5px solid var(--amber);border-radius:7px;font-family:'Archivo Black',sans-serif;font-weight:900;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px"
                    >⚠ Signaler réserve</button>
                  ` : ''}
                  <button
                    onclick="window.__BOB__.dupeO('${o.id}')"
                    style="height:40px;padding:0 14px;background:transparent;color:var(--txt2);border:1px solid var(--border);border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer"
                  >Dupliquer ↻</button>
                  <button
                    onclick="window.__BOB__.openOrderChat('${o.id}','${o.id}');window.__BOB__.sSTb('chat')"
                    style="height:40px;padding:0 14px;background:transparent;color:var(--blue);border:1px solid var(--blue);border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px"
                  >💬 Discuter</button>
                </div>
              </div>
            ` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

function tabStock() {
  const sh = A.selShop;
  if (!sh) return '';
  const cats = oCats();
  const lows = getLowStock(sh.id);
  const notice = stockRuntimeNotice();
  const loadingOnly = A.runtime.stockLoading && !A.runtime.stockHydrated;

  return `
    <div style="padding:14px;max-width:720px;width:100%;margin:0 auto">
      ${notice}
      ${loadingOnly ? '' : lows.length > 0 ? `
        <div style="
          background:${A.dark ? '#2D1B00' : '#FFF7ED'};
          border:1px solid #FED7AA;
          border-radius:8px;
          padding:10px 12px;
          display:flex;align-items:center;gap:8px;
          font-size:13px;font-weight:600;
          color:${A.dark ? '#FCD34D' : '#92400E'};
          margin-bottom:12px
        ">
          ⚠️ ${lows.length} produit${lows.length > 1 ? 's' : ''} sous le seuil d'alerte
        </div>
      ` : ''}

      ${loadingOnly ? '' : cats.map(cat => {
        const prods = aP().filter(p => p.cat === cat);
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0 5px">
            <div style="flex:1;height:1px;background:var(--border)"></div>
            <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--txt3)">${cat}</span>
            <div style="flex:1;height:1px;background:var(--border)"></div>
          </div>
          ${prods.map(p => {
            const s = (A.stock[sh.id] || {})[p.id] || { qty: 0, alert: 10 };
            const low = s.qty <= s.alert;
            return `
              <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:10px 0;border-bottom:1px solid var(--border);gap:12px
              ">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--txt)">${p.name}</div>
                  <div style="font-size:11px;color:var(--txt3);margin-top:1px">Seuil : ${s.alert} ${p.unit}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:${low ? 'var(--red)' : 'var(--green)'}">
                    ${s.qty}
                  </div>
                  <div style="font-size:10px;color:${low ? 'var(--red)' : 'var(--txt3)'};font-weight:600">
                    ${p.unit}${low ? ' · ⚠ BAS' : ''}
                  </div>
                </div>
              </div>`;
          }).join('')}`;
      }).join('')}
    </div>`;
}

function tabProfile() {
  const u = A.cUser;
  if (!u) return '';

  return `
    <div style="padding:20px;max-width:400px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--txt);letter-spacing:-.3px;margin-bottom:22px">
        Mon profil
      </div>

      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px">
          <div style="position:relative;cursor:pointer" onclick="window.__BOB__.trPh()">
            <div style="
              width:64px;height:64px;border-radius:12px;
              background:var(--txt);
              display:flex;align-items:center;justify-content:center;
              color:var(--bg2);font-size:22px;font-weight:700;
              overflow:hidden
            ">
              ${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : u.name[0]}
            </div>
            <div style="
              position:absolute;bottom:-4px;right:-4px;
              background:var(--txt);border:2px solid var(--bg2);
              border-radius:6px;width:20px;height:20px;
              display:flex;align-items:center;justify-content:center;font-size:10px
            ">📷</div>
            <input type="file" id="phi" accept="image/*" style="display:none" onchange="window.__BOB__.hdPh(event)"/>
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--txt)">${u.name}</div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;color:var(--txt3);margin-top:3px">${(ROLE_LABELS[u.role] || u.role).toUpperCase()}</div>
          </div>
        </div>

        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:6px">Nom d'affichage</div>
          <input id="pn" value="${u.name}" placeholder="Nom"
            style="width:100%;height:42px;padding:0 12px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg2);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none"
            onfocus="this.style.borderColor='var(--txt)'" onblur="this.style.borderColor='var(--border)'"
          />
        </div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:6px">Nouveau mot de passe</div>
          <input id="pp" type="password" placeholder="Laisser vide pour ne pas changer"
            style="width:100%;height:42px;padding:0 12px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg2);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none"
            onfocus="this.style.borderColor='var(--txt)'" onblur="this.style.borderColor='var(--border)'"
          />
        </div>
        <button
          onclick="window.__BOB__.svPr()"
          style="
            width:100%;height:44px;
            background:var(--txt);color:var(--bg2);
            border:none;border-radius:7px;
            font-family:'Syne',sans-serif;font-weight:700;font-size:13px;
            letter-spacing:.5px;cursor:pointer
          "
        >Sauvegarder</button>
      </div>
    </div>`;
}

export function bShop() {
  const tabs = [
    { id: 'order',    label: 'Commander',  icon: '🛒' },
    { id: 'orders',   label: 'Commandes',  icon: '📋' },
    { id: 'stock',    label: 'Mon stock',  icon: '📦' },
    { id: 'profile',  label: 'Profil',     icon: '👤' },
    { id: 'chat',     label: 'Messages',   icon: '💬' },
    { id: 'calendar', label: 'Calendrier', icon: '📅' },
    { id: 'planning', label: 'Planning',   icon: '📆' },
    ...(isAdmin() ? [{ id: 'audit', label: 'Audit', icon: '🔍' }] : []),
  ];

  let content = '';
  switch (A.sTab) {
    case 'order':    content = tabOrder();   break;
    case 'orders':   content = tabOrders();  break;
    case 'stock':    content = tabStock();   break;
    case 'profile':  content = tabProfile(); break;
    case 'chat':     content = bChat();      break;
    case 'calendar': content = bCalendar(); break;
    case 'planning': content = bPlanningSection(); break;
    case 'audit':    content = bAuditSection(); break;
    default:         content = tabOrder();
  }

  return `
    <div style="min-height:100vh;background:var(--bg);display:flex;flex-direction:column">
      ${shopHeader()}

      <div style="
        display:flex;
        background:var(--bg2);
        border-bottom:1px solid var(--border);
        overflow-x:auto;
        scrollbar-width:none;
        padding:0 4px
      ">
        ${tabs.map(t => `
          <button
            onclick="window.__BOB__.sSTb('${t.id}')"
            style="
              height:42px;padding:0 14px;
              border:none;background:transparent;
              font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;
              color:${A.sTab === t.id ? 'var(--txt)' : 'var(--txt3)'};
              border-bottom:2px solid ${A.sTab === t.id ? 'var(--txt)' : 'transparent'};
              cursor:pointer;white-space:nowrap;flex-shrink:0;
              transition:color .12s,border-color .12s;
              display:flex;align-items:center;gap:5px
            "
          >${t.icon} ${t.label}${t.id === 'chat' ? chatBadge() : t.id === 'calendar' ? calBadge() : t.id === 'orders' ? receptionBadge() : ''}</button>
        `).join('')}
      </div>

      <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch" class="fade">
        ${content}
      </div>
    </div>`;
}

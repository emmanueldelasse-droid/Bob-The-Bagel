/* ============================================================
   BOBtheBAGEL — views/kitchen.js v2
   ============================================================ */

import { A, ORDER_STATUSES } from '../state.js';
import { aP, oCats, gP, fD, fT, fDl } from '../utils.js';
import { isAdmin } from '../auth.js';
import { bChat, chatBadge } from './chat.js';
import { bCalendar, calBadge, calDashboardWidget } from './calendar.js';
import { unseenCountForUser } from '../modules/notifications.js';
import { bPlanningSection } from './planning.js';
import { totalUnread } from '../modules/chat.js';
import { getLowStock } from '../modules/stock.js';
import { enterShopPlanningContext } from '../modules/planning.js';

export const KITCHEN_SHOP_ID = 'cuisine-centrale';

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
    <div style="background:${tone.bg};border:1px solid ${tone.border};border-radius:8px;padding:10px 12px;margin:0 16px 12px;color:${tone.color}">
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
      text: 'Les commandes boutiques sont en cours de synchronisation avec la base.',
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
      text: 'La vue cuisine lit les commandes Supabase.',
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
      text: 'Le stock cuisine est en cours de synchronisation avec la base.',
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

function kitchenHeader() {
  const pending = A.orders.filter(o => o.status === 'pending').length;

  return `
    <div class="hdr hdr-kitchen">
      <div style="display:flex;align-items:center;gap:8px">
        <button
          style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:0 10px;height:32px;border-radius:6px;color:rgba(255,255,255,.7);font-size:12px;font-family:'Space Grotesk',sans-serif;font-weight:600"
          onclick="window.__BOB__.goSel()"
        >← Retour</button>
        <div class="logo" style="font-size:18px">
          <span class="b1">CUISINE</span>
        </div>
        ${pending > 0 ? `
          <span style="background:var(--red);color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;font-family:'Space Grotesk',sans-serif">
            ${pending} en attente
          </span>
        ` : ''}
      </div>
      <div style="display:flex;gap:6px">
        ${isAdmin() ? `<button style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);width:32px;height:32px;border-radius:6px;color:rgba(255,255,255,.7);font-size:14px" onclick="window.__BOB__.goAdm()">⚙</button>` : ''}
        <button style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);width:32px;height:32px;border-radius:6px;color:rgba(255,255,255,.7);font-size:14px" onclick="window.__BOB__.logout()">↩</button>
      </div>
    </div>`;
}

function tabKOrders() {
  const orders = [...A.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const notice = ordersRuntimeNotice();
  const loadingOnly = A.runtime.ordersLoading && !A.runtime.ordersHydrated;

  if (!orders.length && loadingOnly) {
    return `<div style="padding:16px">${notice}</div>`;
  }

  if (!orders.length) {
    return `
      <div style="padding:16px">
        ${notice}
        <div style="padding:60px 20px;text-align:center">
          <div style="font-size:32px;margin-bottom:12px">✅</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--txt);margin-bottom:6px">Aucune commande</div>
          <div style="font-size:13px;color:var(--txt2)">Les commandes des boutiques apparaîtront ici.</div>
        </div>
      </div>`;
  }

  return `
    <div style="padding:16px">
      ${notice}
      ${orders.map(o => {
        const st = ORDER_STATUSES[o.status] || {};
        const open = A['oO_' + o.id];
        const editing = !!A['eQ_' + o.id];

        return `
          <div class="card" style="border-left:3px solid ${o.shopColor || 'var(--border)'}">
            <div
              style="padding:14px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;cursor:pointer"
              onclick="window.__BOB__.tO('${o.id}')"
            >
              <div style="min-width:0;flex:1">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap">
                  <div style="width:8px;height:8px;border-radius:50%;background:${o.shopColor};flex-shrink:0"></div>
                  <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt)">${o.shopName}</span>
                  <span style="font-size:11px;color:var(--txt3)">${o.id}</span>
                </div>
                <div style="font-size:12px;color:var(--txt2)">${fD(o.createdAt)} ${fT(o.createdAt)} · ${o.orderedBy}</div>
                <div style="font-size:12px;color:var(--txt2)">📦 ${fDl(o.delivery)}${o.deliveryTime ? ` · ⏰ ${o.deliveryTime}` : ''}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                <span class="badge" style="background:${st.dot}18;color:${st.dot}">
                  <span class="badge-dot" style="background:${st.dot}"></span>${st.label}
                </span>
                <span style="font-size:12px;color:var(--txt3)">${open ? '▲' : '▼'}</span>
              </div>
            </div>

            ${open ? `
              <div style="padding:0 16px 16px;border-top:1px solid var(--border)">
                ${editing ? `
                  <div style="margin-bottom:12px">
                    <div class="label" style="margin-bottom:8px;color:var(--amber)">Modifier les quantités</div>
                    ${(o.items || []).map(i => {
                      const p  = gP(i.id);
                      const eq = A['eQ_' + o.id];
                      return `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);gap:10px">
                          <span style="font-size:13px;color:var(--txt);flex:1">${p?.name}</span>
                          <div class="qty-wrap">
                            <button class="qty-btn" onclick="window.__BOB__.sEQ('${o.id}','${i.id}',Math.max(0,(${eq?.[i.id]??i.qty})-${p?.step||1}))">−</button>
                            <input class="qty-val" type="number" value="${eq?.[i.id] ?? i.qty}" min="0" step="${p?.step || 1}"
                              onchange="window.__BOB__.sEQ('${o.id}','${i.id}',this.value)"
                              oninput="window.__BOB__.sEQ('${o.id}','${i.id}',this.value)"
                            />
                            <button class="qty-btn" onclick="window.__BOB__.sEQ('${o.id}','${i.id}',(${eq?.[i.id]??i.qty})+(${p?.step||1}))">+</button>
                          </div>
                          <span style="font-size:11px;color:var(--txt3);width:24px">${p?.unit}</span>
                        </div>`;
                    }).join('')}
                    <div style="display:flex;gap:8px;margin-top:12px">
                      <button class="btn btn-primary" style="flex:1" onclick="window.__BOB__.svEQ('${o.id}')">Enregistrer ✓</button>
                      <button class="btn btn-ghost" onclick="window.__BOB__.cxEQ('${o.id}')">Annuler</button>
                    </div>
                  </div>
                ` : `
                  ${(o.items || []).map(i => {
                    const p = gP(i.id);
                    return `
                      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
                        <span style="font-size:13px;color:var(--txt)">${p?.name || i.id}</span>
                        <span style="font-size:13px;font-weight:700">${i.qty} <span style="color:var(--txt3);font-weight:400">${p?.unit}</span></span>
                      </div>`;
                  }).join('')}
                `}

                ${o.note ? `<div style="margin:10px 0 0;font-size:12px;color:var(--txt2);background:var(--bg3);padding:8px 10px;border-radius:var(--r2)">💬 ${o.note}</div>` : ''}

                ${!editing ? `
                  <div style="margin-top:10px">
                    <textarea
                      class="textarea"
                      rows="2"
                      placeholder="Commentaire cuisine…"
                      oninput="window.__BOB__.sOC('${o.id}',this.value)"
                      onblur="window.__BOB__.saveComment('${o.id}')"
                    >${o.comment || ''}</textarea>
                  </div>

                  <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
                    ${o.status === 'pending' ? `
                      <button class="btn btn-primary" style="flex:1" onclick="window.__BOB__.sOS('${o.id}','preparing')">🔧 En préparation</button>
                      <button class="btn btn-danger" onclick="window.__BOB__.cfR('${o.id}')">Refuser</button>
                      <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.stEQ('${o.id}')">✏ Qtés</button>
                    ` : ''}
                    ${o.status === 'preparing' ? `
                      <button class="btn btn-primary" style="flex:1" onclick="window.__BOB__.cfV('${o.id}')">✓ Valider</button>
                      <button class="btn btn-outline" style="flex:1" onclick="window.__BOB__.sOS('${o.id}','delivering')">🚚 En livraison</button>
                      <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.stEQ('${o.id}')">✏ Qtés</button>
                    ` : ''}
                    ${o.status === 'received' ? `<span style="font-size:12px;color:var(--green);font-weight:600">✓ Réceptionnée par la boutique</span>` : ''}
                    ${o.status === 'rejected' ? `<span style="font-size:12px;color:var(--red);font-weight:600">✗ Refusée${o.validatedBy ? ` par ${o.validatedBy}` : ''}</span>` : ''}
                    ${(o.status === 'validated' || o.status === 'delivering') ? `<span style="font-size:12px;color:var(--txt2)">En attente de réception boutique…</span>` : ''}
                    <button
                      onclick="window.__BOB__.openOrderChat('${o.id}','${o.id}');window.__BOB__.sKTb('chat')"
                      style="height:36px;padding:0 12px;background:transparent;color:var(--blue);border:1.5px solid var(--blue);border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;flex-shrink:0"
                    >💬 Discuter</button>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

function tabKStock() {
  const cats = oCats();
  const lows = getLowStock('kitchen');
  const notice = stockRuntimeNotice();
  const loadingOnly = A.runtime.stockLoading && !A.runtime.stockHydrated;

  return `
    <div style="padding:16px">
      ${notice}
      ${loadingOnly ? '' : `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        ${lows.length > 0
          ? `<div class="alert-low"><span>⚠️</span><span>${lows.length} alerte${lows.length > 1 ? 's' : ''} stock</span></div>`
          : `<div style="background:var(--lgreen);border:1px solid var(--green);border-radius:var(--r2);padding:8px 12px;font-size:13px;font-weight:600;color:var(--green)">✓ Stocks OK</div>`
        }
        <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.prtPDF()">📄 Bon de besoin</button>
      </div>`}

      ${loadingOnly ? '' : cats.map(cat => {
        const prods = aP().filter(p => p.cat === cat);
        return `
          <div class="cat-sep">
            <div class="cat-line"></div>
            <div class="cat-label">${cat}</div>
            <div class="cat-line"></div>
          </div>
          ${prods.map(p => {
            const s = (A.stock.kitchen || {})[p.id] || { qty: 0, alert: 0 };
            const low = s.qty <= s.alert;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);background:${low ? (A.dark?'#2D1B00':'#FFF7ED') : 'var(--bg2)'}">
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px;color:var(--txt)">${p.name}</div>
                  <div style="font-size:11px;color:var(--txt3);margin-top:2px;display:flex;align-items:center;gap:6px">
                    Seuil :
                    <input
                      type="number"
                      value="${s.alert}"
                      min="0"
                      style="width:48px;border:1px solid var(--border);border-radius:4px;padding:1px 4px;font-size:11px;background:var(--bg2);color:var(--txt);outline:none;font-family:'Space Grotesk',sans-serif"
                      onchange="window.__BOB__.uSt('kitchen','${p.id}','alert',this.value)"
                    />
                    ${p.unit}
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="qty-wrap">
                    <button class="qty-btn" onclick="window.__BOB__.uSt('kitchen','${p.id}','qty',Math.max(0,${s.qty}-${p.step}))">−</button>
                    <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:${low?'var(--red)':'var(--green)'};width:48px;text-align:center;display:inline-block">${s.qty}</span>
                    <button class="qty-btn" onclick="window.__BOB__.uSt('kitchen','${p.id}','qty',${s.qty}+${p.step})">+</button>
                  </div>
                  <span style="font-size:11px;color:var(--txt3);width:24px">${p.unit}</span>
                </div>
              </div>`;
          }).join('')}`;
      }).join('')}
    </div>`;
}

function tabKReceipts() {
  const cats = oCats();

  return `
    <div style="padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt)">Réceptions fournisseur</div>
        <button class="btn btn-primary btn-sm" onclick="window.__BOB__.tARc()">+ Réception</button>
      </div>

      ${A.addRc ? `
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:16px">
          <div class="label" style="margin-bottom:8px">Nouveau fournisseur</div>
          <input class="input" placeholder="Nom du fournisseur" oninput="window.__BOB__.sRS(this.value)" style="margin-bottom:12px"/>

          <div class="tabs" style="margin-bottom:10px;border-radius:var(--r2) var(--r2) 0 0;overflow:hidden">
            ${cats.map(c => `
              <button class="tab${A.rcCat === c ? ' on' : ''}" onclick="window.__BOB__.sRCat('${c}')" style="font-size:11px;height:36px">${c}</button>
            `).join('')}
          </div>

          ${aP().filter(p => p.cat === A.rcCat).map(p => `
            <div class="product-row">
              <div>
                <div class="product-name">${p.name}</div>
                <div class="product-meta">${p.unit}</div>
              </div>
              <div class="qty-wrap">
                <button class="qty-btn" onclick="window.__BOB__.sRC('${p.id}',Math.max(0,(${A.rcForm?.cart?.[p.id]||0})-${p.step}))">−</button>
                <input class="qty-val" type="number" value="${A.rcForm?.cart?.[p.id] || 0}" min="0" step="${p.step}"
                  onchange="window.__BOB__.sRC('${p.id}',this.value)"
                  oninput="window.__BOB__.sRC('${p.id}',this.value)"
                />
                <button class="qty-btn" onclick="window.__BOB__.sRC('${p.id}',(${A.rcForm?.cart?.[p.id]||0})+(${p.step}))">+</button>
              </div>
            </div>
          `).join('')}

          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn-primary" style="flex:1" onclick="window.__BOB__.sbRc()">Enregistrer ✓</button>
            <button class="btn btn-ghost" onclick="window.__BOB__.tARc()">Annuler</button>
          </div>
        </div>
      ` : ''}

      ${A.receipts.map(r => `
        <div class="card" style="cursor:pointer" onclick="window.__BOB__.tRc('${r.id}')">
          <div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--txt)">${r.supplier}</div>
              <div style="font-size:12px;color:var(--txt2);margin-top:2px">${fD(r.createdAt)} · ${r.receivedBy}</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--green)">${r.items?.length || 0} produits</div>
              <div style="font-size:11px;color:var(--txt3)">${A['oRc_'+r.id] ? '▲' : '▼'}</div>
            </div>
          </div>
          ${A['oRc_'+r.id] ? `
            <div style="padding:0 16px 16px;border-top:1px solid var(--border)">
              ${(r.items||[]).map(i=>{const p=gP(i.id);return`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px">${p?.name||i.id}</span><span style="font-size:13px;font-weight:700">${i.qty} ${p?.unit||''}</span></div>`;}).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}

      ${!A.receipts.length ? `<div style="text-align:center;color:var(--txt2);font-size:13px;padding:40px 0">Aucune réception enregistrée</div>` : ''}
    </div>`;
}

export function bKitchen() {
  const tabs = [
    { id: 'orders',   label: 'Commandes',  icon: '📋' },
    { id: 'stock',    label: 'Stock',      icon: '📦' },
    { id: 'receipts', label: 'Réceptions', icon: '🚛' },
    { id: 'chat',     label: 'Messages',   icon: '💬' },
    { id: 'calendar', label: 'Calendrier', icon: '📅' },
    { id: 'planning', label: 'Planning',   icon: '📆' },
  ];

  let content = '';
  switch (A.kTab) {
    case 'orders':   content = tabKOrders();   break;
    case 'stock':    content = tabKStock();    break;
    case 'receipts': content = tabKReceipts(); break;
    case 'chat':     content = bChat();        break;
    case 'calendar': content = bCalendar();   break;
    case 'planning': content = bPlanningSection(); break;
    default:         content = tabKOrders();
  }

  return `
    <div class="page">
      ${kitchenHeader()}
      <div style="background:var(--txt)">
        <div class="tabs" style="background:transparent;border-color:rgba(255,255,255,.1)">
          ${tabs.map(t => `
            <button class="tab kitchen-tab${A.kTab === t.id ? ' on' : ''}" onclick="window.__BOB__.sKTb('${t.id}')">
              ${t.icon} ${t.label}${t.id === 'chat' ? chatBadge() : t.id === 'calendar' ? calBadge() : ''}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="main fade">${content}</div>
    </div>`;
}

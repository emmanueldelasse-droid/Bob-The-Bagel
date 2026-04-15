/* ============================================================
   BOBtheBAGEL — views/shop.js v2
   ============================================================ */

import { A, SHOPS, ORDER_STATUSES } from '../state.js';
import { aP, oCats, gP, fD, fT, fDl, cSec } from '../utils.js';
import { isAdmin } from '../auth.js';
import { bSum }   from './modals.js';
import { getLowStock, stockLevel } from '../modules/stock.js';

// ── Header boutique ────────────────────────────────────────
function shopHeader() {
  const sh = A.selShop;

  return `
    <div class="hdr">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.goSel()">← Retour</button>
        <div class="logo" style="font-size:18px">
          <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        ${isAdmin() ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.goAdm()">⚙</button>` : ''}
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()">◑</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.logout()">↩</button>
      </div>
    </div>

    ${SHOPS.length > 1 ? `
      <div class="context-bar">
        ${SHOPS.map(s => `
          <button
            class="context-pill"
            style="border-color:${s.color};color:${A.selShop?.id === s.id ? '#fff' : s.color};background:${A.selShop?.id === s.id ? s.color : 'transparent'}"
            onclick="window.__BOB__.switchShop('${s.id}')"
          >${s.name}</button>
        `).join('')}
      </div>
    ` : ''}

    <div class="shop-bar" style="background:${sh?.color || 'var(--txt)'}">
      <span class="shop-bar-name">${sh?.name || ''}</span>
    </div>`;
}

// ── Onglet commande ────────────────────────────────────────
function tabOrder() {
  const cats      = oCats();
  const sh        = A.selShop;
  const cartItems = A.products.filter(p => p.active && (A.cart[p.id] || 0) > 0);
  const cartCount = cartItems.length;
  const cartQty   = cartItems.reduce((n, p) => n + A.cart[p.id], 0);

  return `
    <div class="pb-footer">
      <!-- Recherche + dates -->
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid var(--border);background:var(--bg2)">
        <input
          class="input"
          placeholder="Rechercher un produit…"
          value="${A.search || ''}"
          oninput="window.__BOB__.sSch(this.value)"
        />
        <div style="display:flex;gap:8px">
          <div style="flex:1">
            <div class="label" style="margin-bottom:4px">Date souhaitée</div>
            <input
              type="date"
              class="input"
              value="${A.del}"
              min="${new Date().toISOString().split('T')[0]}"
              onchange="window.__BOB__.sDel(this.value)"
            />
          </div>
          <div style="width:130px">
            <div class="label" style="margin-bottom:4px">Heure</div>
            <input
              type="time"
              class="input"
              value="${A.delT}"
              onchange="window.__BOB__.sDelT(this.value)"
            />
          </div>
        </div>
      </div>

      <!-- Catalogue -->
      ${cats.map(cat => {
        const prods = aP().filter(p =>
          p.cat === cat &&
          (!A.search || p.name.toLowerCase().includes(A.search.toLowerCase()))
        );
        if (!prods.length) return '';

        const subs  = [...new Set(prods.map(p => p.sub).filter(Boolean))];
        const noSub = prods.filter(p => !p.sub);

        return `
          <div class="cat-sep">
            <div class="cat-line"></div>
            <div class="cat-label">${cat}</div>
            <div class="cat-line"></div>
          </div>
          ${noSub.map(p => productRow(p, sh)).join('')}
          ${subs.map(sub => `
            <div class="sub-label">${sub}</div>
            ${prods.filter(p => p.sub === sub).map(p => productRow(p, sh)).join('')}
          `).join('')}`;
      }).join('')}

      <!-- Note -->
      <div style="padding:16px;border-top:1px solid var(--border);background:var(--bg2);margin-top:8px">
        <div class="label" style="margin-bottom:8px">Note opérationnelle</div>
        <textarea
          class="textarea"
          rows="3"
          placeholder="Urgences, précisions, remarques…"
          oninput="window.__BOB__.sNote(this.value)"
        >${A.note}</textarea>
      </div>
    </div>

    <!-- Sticky footer bouton envoi -->
    <div class="sticky-footer">
      <button
        class="btn btn-primary btn-lg btn-full ${cartCount === 0 ? 'dbl' : ''}"
        onclick="${cartCount > 0 ? 'window.__BOB__.oSum()' : ''}"
        style="justify-content:space-between"
      >
        <span>Envoyer la commande</span>
        ${cartCount > 0 ? `
          <span style="background:rgba(255,255,255,.2);border-radius:6px;padding:2px 10px;font-size:12px;font-weight:600">
            ${cartQty} art.
          </span>
        ` : ''}
      </button>
    </div>

    ${A.summary ? bSum() : ''}`;
}

function productRow(p, sh) {
  const qty    = A.cart[p.id] || 0;
  const active = qty > 0;
  const level  = sh ? stockLevel(sh.id, p.id) : 'ok';
  const stock  = sh ? (A.stock[sh.id]?.[p.id]?.qty ?? '—') : null;

  return `
    <div class="product-row ${active ? 'active' : ''}">
      <div style="flex:1;min-width:0">
        <div class="product-name">${p.name}
          ${level === 'low' ? `<span style="font-size:10px;color:var(--amber);font-weight:700;margin-left:6px">⚠ bas</span>` : ''}
        </div>
        <div class="product-meta">
          +${p.step} ${p.unit}
          ${stock !== null ? ` · Stock : ${stock} ${p.unit}` : ''}
        </div>
      </div>
      <div class="qty-wrap">
        <button class="qty-btn" onclick="window.__BOB__.sCart('${p.id}',Math.max(0,(${qty})-${p.step}))">−</button>
        <input
          class="qty-val"
          type="number"
          value="${qty}"
          min="0"
          step="${p.step}"
          onchange="window.__BOB__.sCart('${p.id}',this.value)"
          oninput="window.__BOB__.sCart('${p.id}',this.value)"
        />
        <button class="qty-btn" onclick="window.__BOB__.qAdd('${p.id}')">+</button>
      </div>
    </div>`;
}

// ── Onglet commandes boutique ──────────────────────────────
function tabOrders() {
  const sh     = A.selShop;
  const orders = A.orders.filter(o => o.shopId === sh?.id);

  if (!orders.length) {
    return `
      <div style="padding:60px 20px;text-align:center">
        <div style="font-size:32px;margin-bottom:12px">📋</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--txt);margin-bottom:6px">Aucune commande</div>
        <div style="font-size:13px;color:var(--txt2)">Vos commandes apparaîtront ici.</div>
      </div>`;
  }

  return `
    <div style="padding:16px">
      ${orders.map(o => {
        const st   = ORDER_STATUSES[o.status] || {};
        const open = A['oO_' + o.id];

        return `
          <div class="card" style="border-left:3px solid ${st.dot || 'var(--border)'}">
            <div
              style="padding:14px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;cursor:pointer"
              onclick="window.__BOB__.tO('${o.id}')"
            >
              <div style="min-width:0;flex:1">
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt);margin-bottom:2px">${o.id}</div>
                <div style="font-size:12px;color:var(--txt2)">${fD(o.createdAt)} · ${fT(o.createdAt)}</div>
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
                ${(o.items || []).map(i => {
                  const p = gP(i.id);
                  return `
                    <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
                      <span style="font-size:13px;color:var(--txt)">${p?.name || i.id}</span>
                      <span style="font-size:13px;font-weight:700">${i.qty} <span style="color:var(--txt3);font-weight:400">${p?.unit}</span></span>
                    </div>`;
                }).join('')}

                ${o.note ? `<div style="margin-top:10px;font-size:12px;color:var(--txt2);background:var(--bg3);padding:8px 10px;border-radius:var(--r2)">💬 ${o.note}</div>` : ''}
                ${o.comment ? `<div style="margin-top:6px;font-size:12px;color:var(--blue);padding:8px 10px;background:${A.dark?'#1e2d47':'#EFF6FF'};border-radius:var(--r2)">🍳 ${o.comment}</div>` : ''}

                <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
                  ${(o.status === 'validated' || o.status === 'delivering') ? `
                    <button class="btn btn-primary" style="flex:1" onclick="window.__BOB__.cfSRc('${o.id}')">
                      Confirmer réception 📦
                    </button>
                  ` : ''}
                  <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.dupeO('${o.id}')">Dupliquer ↻</button>
                </div>
              </div>
            ` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

// ── Onglet stock boutique ──────────────────────────────────
function tabStock() {
  const sh   = A.selShop;
  if (!sh) return '';
  const cats = oCats();
  const lows = getLowStock(sh.id);

  return `
    <div style="padding:16px">
      ${lows.length > 0 ? `
        <div class="alert-low">
          <span>⚠️</span>
          <span>${lows.length} produit${lows.length > 1 ? 's' : ''} en dessous du seuil d'alerte</span>
        </div>
      ` : ''}

      ${cats.map(cat => {
        const prods = aP().filter(p => p.cat === cat);
        return `
          <div class="cat-sep">
            <div class="cat-line"></div>
            <div class="cat-label">${cat}</div>
            <div class="cat-line"></div>
          </div>
          ${prods.map(p => {
            const s   = (A.stock[sh.id] || {})[p.id] || { qty: 0, alert: 10 };
            const low = s.qty <= s.alert;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);background:${low ? (A.dark ? '#2D1B00' : '#FFF7ED') : 'var(--bg2)'}">
                <div>
                  <div style="font-weight:600;font-size:14px;color:var(--txt)">${p.name}</div>
                  <div style="font-size:11px;color:var(--txt3);margin-top:2px">Seuil alerté : ${s.alert} ${p.unit}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:${low ? 'var(--red)' : 'var(--green)'}">
                    ${s.qty}
                  </div>
                  <div style="font-size:11px;color:var(--txt3)">${p.unit}${low ? ' · ⚠ BAS' : ''}</div>
                </div>
              </div>`;
          }).join('')}`;
      }).join('')}
    </div>`;
}

// ── Profil ─────────────────────────────────────────────────
function tabProfile() {
  const u = A.cUser;
  if (!u) return '';

  return `
    <div style="padding:24px;max-width:400px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--txt);letter-spacing:-.3px;margin-bottom:24px">
        Mon profil
      </div>

      <div style="display:flex;flex-direction:column;gap:14px">
        <!-- Avatar -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
          <div style="position:relative;cursor:pointer" onclick="window.__BOB__.trPh()">
            <div style="width:72px;height:72px;border-radius:14px;background:var(--txt);display:flex;align-items:center;justify-content:center;color:var(--bg2);font-size:26px;font-weight:700;overflow:hidden">
              ${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : u.name[0]}
            </div>
            <div style="position:absolute;bottom:-4px;right:-4px;background:var(--txt);border-radius:6px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid var(--bg2)">📷</div>
            <input type="file" id="phi" accept="image/*" style="display:none" onchange="window.__BOB__.hdPh(event)"/>
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--txt)">${u.name}</div>
            <div class="label" style="margin-top:3px">${u.role}</div>
          </div>
        </div>

        <div>
          <div class="label" style="margin-bottom:6px">Nom d'affichage</div>
          <input id="pn" class="input" value="${u.name}" placeholder="Nom"/>
        </div>
        <div>
          <div class="label" style="margin-bottom:6px">Nouveau mot de passe</div>
          <input id="pp" class="input" type="password" placeholder="Laisser vide pour ne pas changer"/>
        </div>
        <button class="btn btn-primary btn-lg btn-full" onclick="window.__BOB__.svPr()">Sauvegarder</button>
      </div>
    </div>`;
}

// ── Vue boutique principale ────────────────────────────────
export function bShop() {
  const tabs = [
    { id: 'order',   label: 'Commander',  icon: '🛒' },
    { id: 'orders',  label: 'Commandes',  icon: '📋' },
    { id: 'stock',   label: 'Mon stock',  icon: '📦' },
    { id: 'profile', label: 'Profil',     icon: '👤' },
  ];

  let content = '';
  switch (A.sTab) {
    case 'order':   content = tabOrder();   break;
    case 'orders':  content = tabOrders();  break;
    case 'stock':   content = tabStock();   break;
    case 'profile': content = tabProfile(); break;
    default:        content = tabOrder();
  }

  return `
    <div class="page">
      ${shopHeader()}
      <div class="tabs">
        ${tabs.map(t => `
          <button class="tab${A.sTab === t.id ? ' on' : ''}" onclick="window.__BOB__.sSTb('${t.id}')">
            ${t.icon} ${t.label}
          </button>
        `).join('')}
      </div>
      <div class="main fade">${content}</div>
    </div>`;
}

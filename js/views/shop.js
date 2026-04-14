/* ============================================================
   BOBtheBAGEL — js/views/shop.js
   Vue boutique : commande, stock, historique, profil
   ============================================================ */

import { A, SHOPS, ORDER_STATUSES } from '../state.js';
import { aP, oCats, gP, fD, fT, fDl, cSec } from '../utils.js';
import { isAdmin } from '../auth.js';
import { bSum }   from './modals.js';
import { getLowStock, stockLevel } from '../modules/stock.js';

// ── Header boutique ────────────────────────────────────────
function bShopHeader() {
  const sh  = A.selShop;
  const unread = A.orders.filter(o => o.shopId === sh?.id && !A.seen[o.id]).length;

  return `
    <div class="hdr">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="bgh" style="font-size:12px;padding:6px 10px" onclick="window.__BOB__.goSel()">← Retour</button>
        <div class="logo" style="font-size:20px">
          <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px">
        ${isAdmin() ? `<button class="bgh" style="font-size:11px;padding:5px 10px" onclick="window.__BOB__.goAdm()">⚙️</button>` : ''}
        <button class="bgh" style="font-size:11px;padding:5px 10px" onclick="window.__BOB__.toggleDark()">${A.dark ? '☀️' : '🌙'}</button>
        <button class="bgh" style="font-size:11px;padding:5px 10px" onclick="window.__BOB__.logout()">↩</button>
      </div>
    </div>

    ${SHOPS.length > 1 ? `
      <div class="swbar">
        ${SHOPS.map(s => `
          <button
            class="swbtn"
            style="border-color:${s.color};color:${A.selShop?.id === s.id ? '#fff' : s.color};background:${A.selShop?.id === s.id ? s.color : 'transparent'}"
            onclick="window.__BOB__.switchShop('${s.id}')"
          >${s.name}</button>
        `).join('')}
      </div>
    ` : ''}

    <div style="background:${sh?.color || 'var(--gn)'};padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:14px;letter-spacing:3px;color:#fff">
        ${sh?.name || ''}
      </span>
      ${unread > 0 ? `<span style="background:var(--rd);color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:11px;padding:3px 10px;border-radius:20px">${unread} nouveau${unread > 1 ? 'x' : ''}</span>` : ''}
    </div>`;
}

// ── Onglet commande ────────────────────────────────────────
function bOrder() {
  const cats = oCats();
  const sh   = A.selShop;
  const cartCount = Object.values(A.cart).filter(v => v > 0).length;

  return `
    <div style="padding-bottom:80px">
      <!-- Recherche -->
      <div style="padding:10px 14px">
        <input
          class="inf"
          placeholder="🔍 Rechercher un produit..."
          value="${A.search}"
          oninput="window.__BOB__.sSch(this.value)"
          style="font-size:14px"
        />
      </div>

      <!-- Date et heure de livraison -->
      <div style="padding:0 14px 10px;display:flex;gap:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:10px;letter-spacing:3px;color:var(--mt);margin-bottom:4px">DATE SOUHAITÉE</div>
          <input type="date" class="inf" value="${A.del}" onchange="window.__BOB__.sDel(this.value)" style="font-size:14px" min="${new Date().toISOString().split('T')[0]}"/>
        </div>
        <div style="min-width:100px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:10px;letter-spacing:3px;color:var(--mt);margin-bottom:4px">HEURE</div>
          <input type="time" class="inf" value="${A.delT}" onchange="window.__BOB__.sDelT(this.value)" style="font-size:14px"/>
        </div>
      </div>

      <!-- Produits par catégorie -->
      ${cats.map(cat => {
        const prods = aP().filter(p => p.cat === cat && (
          !A.search || p.name.toLowerCase().includes(A.search.toLowerCase())
        ));
        if (!prods.length) return '';

        const subs = [...new Set(prods.map(p => p.sub).filter(Boolean))];
        const noSub = prods.filter(p => !p.sub);

        return `
          ${cSec(cat)}
          ${noSub.map(p => productRow(p, sh)).join('')}
          ${subs.map(sub => `
            <div class="subch">${sub}</div>
            ${prods.filter(p => p.sub === sub).map(p => productRow(p, sh)).join('')}
          `).join('')}
        `;
      }).join('')}

      <!-- Note -->
      <div style="padding:14px">
        <div class="slbl" style="padding:0 0 8px">NOTE OPÉRATIONNELLE</div>
        <textarea
          class="taf"
          rows="3"
          placeholder="Remarques, urgences, précisions..."
          oninput="window.__BOB__.sNote(this.value)"
        >${A.note}</textarea>
      </div>

      <!-- Bouton envoi sticky -->
      <div style="position:fixed;bottom:0;left:0;right:0;padding:12px 14px;background:var(--bg2);border-top:1px solid var(--br);z-index:10;max-width:720px;margin:0 auto">
        <button
          class="bgn ${cartCount === 0 ? 'dbl' : ''}"
          style="width:100%;min-height:52px;font-size:16px;display:flex;align-items:center;justify-content:center;gap:10px"
          onclick="${cartCount > 0 ? 'window.__BOB__.oSum()' : ''}"
        >
          ENVOYER LA COMMANDE
          ${cartCount > 0 ? `<span style="background:rgba(255,255,255,.3);border-radius:20px;padding:2px 10px;font-size:13px">${cartCount} produit${cartCount > 1 ? 's' : ''}</span>` : ''}
        </button>
      </div>
    </div>
    ${A.summary ? bSum() : ''}`;
}

function productRow(p, sh) {
  const qty       = A.cart[p.id] || 0;
  const selected  = qty > 0;
  const level     = sh ? stockLevel(sh.id, p.id) : 'ok';
  const stockInfo = sh ? (A.stock[sh.id]?.[p.id]?.qty ?? '—') : null;

  return `
    <div class="pr ${selected ? 'sel' : ''}">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px">
          <span class="pn">${p.name}</span>
          <span class="pu">+${p.step} ${p.unit}</span>
          ${level === 'low' ? `<span style="font-size:10px;color:var(--yl);font-weight:700">⚠ stock bas</span>` : ''}
        </div>
        ${stockInfo !== null ? `<div style="font-size:11px;color:var(--mt);margin-top:2px">Stock : ${stockInfo} ${p.unit}</div>` : ''}
      </div>
      <div class="qw">
        <button class="qb" style="font-size:18px" onclick="window.__BOB__.sCart('${p.id}', Math.max(0,(${qty})-${p.step}))">−</button>
        <input class="qi" type="number" value="${qty}" min="0" step="${p.step}" onchange="window.__BOB__.sCart('${p.id}',this.value)" oninput="window.__BOB__.sCart('${p.id}',this.value)"/>
        <button class="qb" onclick="window.__BOB__.qAdd('${p.id}')">+</button>
      </div>
    </div>`;
}

// ── Onglet stock boutique ──────────────────────────────────
function bShopStock() {
  const sh   = A.selShop;
  if (!sh) return '';
  const cats = oCats();
  const lows = getLowStock(sh.id);

  return `
    <div style="padding:14px">
      ${lows.length > 0 ? `
        <div style="background:#FFF3CD;border:1px solid #E8B84B;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">⚠️</span>
          <span style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;color:#856404">
            ${lows.length} produit${lows.length > 1 ? 's' : ''} en dessous du seuil d'alerte
          </span>
        </div>
      ` : ''}

      ${cats.map(cat => {
        const prods = aP().filter(p => p.cat === cat);
        return `
          ${cSec(cat)}
          ${prods.map(p => {
            const s     = (A.stock[sh.id] || {})[p.id] || { qty: 0, alert: 10 };
            const isLow = s.qty <= s.alert;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--br);background:${isLow ? '#FFF8F0' : 'var(--bg2)'}">
                <div>
                  <div style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;color:var(--bk)">${p.name}</div>
                  <div style="font-size:11px;color:var(--mt);margin-top:2px">Seuil : ${s.alert} ${p.unit}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:${isLow ? 'var(--rd)' : 'var(--gn)'}">
                    ${s.qty} <span style="font-size:12px;font-weight:700">${p.unit}</span>
                  </div>
                  ${isLow ? `<div style="font-size:10px;color:var(--rd);font-weight:700">⚠ BAS</div>` : ''}
                </div>
              </div>`;
          }).join('')}`;
      }).join('')}
    </div>`;
}

// ── Onglet historique commandes boutique ───────────────────
function bShopOrders() {
  const sh     = A.selShop;
  const orders = A.orders.filter(o => o.shopId === sh?.id);

  if (!orders.length) {
    return `<div style="padding:40px 20px;text-align:center;color:var(--mt);font-size:14px">Aucune commande</div>`;
  }

  return `
    <div style="padding:14px">
      ${orders.map(o => {
        const st   = ORDER_STATUSES[o.status] || {};
        const open = A['oO_' + o.id];

        return `
          <div class="card chlb" style="border-left-color:${st.dot || 'var(--br)'}">
            <!-- Header commande -->
            <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="window.__BOB__.tO('${o.id}')">
              <div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;letter-spacing:1px;color:var(--bk)">${o.id}</div>
                <div style="font-size:11px;color:var(--mt);margin-top:2px">${fD(o.createdAt)} · ${fT(o.createdAt)} · ${o.orderedBy}</div>
                <div style="font-size:11px;color:var(--mt)">📦 ${fDl(o.delivery)}${o.deliveryTime ? ` · ⏰ ${o.deliveryTime}` : ''}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="bdg" style="background:${st.color}22;color:${st.color}">
                  <span class="bdd" style="background:${st.dot}"></span>${st.label}
                </span>
                <span style="color:var(--mt)">${open ? '▲' : '▼'}</span>
              </div>
            </div>

            ${open ? `
              <!-- Détail -->
              <div style="padding:0 14px 14px;border-top:1px solid var(--br)">
                <!-- Items -->
                ${(o.items || []).map(i => {
                  const p = gP(i.id);
                  return `
                    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--br)">
                      <span style="font-size:13px;color:var(--bk)">${p?.name || i.id}</span>
                      <span style="font-size:13px;font-weight:700;color:var(--bk)">${i.qty} ${p?.unit || ''}</span>
                    </div>`;
                }).join('')}

                ${o.note ? `<div style="margin-top:10px;font-size:12px;color:var(--mt);font-style:italic">💬 ${o.note}</div>` : ''}
                ${o.comment ? `<div style="margin-top:6px;font-size:12px;color:var(--bl)">Cuisine : ${o.comment}</div>` : ''}

                <!-- Actions -->
                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                  ${o.status === 'validated' || o.status === 'delivering' ? `
                    <button class="bgn" style="flex:1;min-height:44px;font-size:13px" onclick="window.__BOB__.cfSRc('${o.id}')">
                      Confirmer réception 📦
                    </button>
                  ` : ''}
                  <button class="bgh" style="min-height:44px;font-size:12px" onclick="window.__BOB__.dupeO('${o.id}')">
                    Dupliquer ↻
                  </button>
                </div>
              </div>
            ` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

// ── Vue boutique principale ────────────────────────────────
export function bShop() {
  const tabs = [
    { id: 'order',  label: '🛒 Commander' },
    { id: 'orders', label: '📋 Commandes' },
    { id: 'stock',  label: '📦 Mon stock' },
    { id: 'profile',label: '👤 Profil'    },
  ];

  let content = '';
  switch (A.sTab) {
    case 'order':   content = bOrder();      break;
    case 'orders':  content = bShopOrders(); break;
    case 'stock':   content = bShopStock();  break;
    case 'profile': content = bProf();       break;
    default:        content = bOrder();
  }

  return `
    <div class="page">
      ${bShopHeader()}
      <div class="tbr">
        ${tabs.map(t => `
          <button class="tb${A.sTab === t.id ? ' on' : ''}" onclick="window.__BOB__.sSTb('${t.id}')">
            ${t.label}
          </button>
        `).join('')}
      </div>
      <div class="main-content">${content}</div>
    </div>`;
}

// ── Profil ────────────────────────────────────────────────
function bProf() {
  const u = A.cUser;
  if (!u) return '';

  return `
    <div style="padding:20px;max-width:400px">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--gn);letter-spacing:2px;margin-bottom:22px">
        MON PROFIL
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;align-items:flex-start">
        <div style="position:relative;cursor:pointer" onclick="window.__BOB__.trPh()">
          <div style="width:84px;height:84px;border-radius:50%;background:var(--gn);display:flex;align-items:center;justify-content:center;color:#fff;font-size:30px;font-weight:700;overflow:hidden;border:3px solid var(--gn)">
            ${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : u.name[0]}
          </div>
          <div style="position:absolute;bottom:0;right:0;background:var(--gn);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px">📷</div>
          <input type="file" id="phi" accept="image/*" style="display:none" onchange="window.__BOB__.hdPh(event)"/>
        </div>
        <input id="pn" class="inf" value="${u.name}" placeholder="Nom" style="min-height:52px"/>
        <input id="pp" class="inf" type="password" placeholder="Nouveau mot de passe" style="min-height:52px"/>
        <button class="bgn" onclick="window.__BOB__.svPr()" style="width:100%;min-height:52px">SAUVEGARDER</button>
      </div>
    </div>`;
}

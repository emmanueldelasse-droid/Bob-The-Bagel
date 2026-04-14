/* ============================================================
   BOBtheBAGEL — js/views/kitchen.js
   Vue cuisine centrale : commandes, stock, réceptions
   ============================================================ */

import { A, ORDER_STATUSES } from '../state.js';
import { aP, oCats, gP, fD, fT, fDl, cSec } from '../utils.js';
import { isAdmin } from '../auth.js';
import { getLowStock } from '../modules/stock.js';

// ── Header cuisine ─────────────────────────────────────────
function bKitchenHeader() {
  const pending = A.orders.filter(o => o.status === 'pending').length;

  return `
    <div class="hdr" style="background:#111;border-color:#333">
      <div style="display:flex;align-items:center;gap:10px">
        <button style="background:transparent;border:1.5px solid #444;padding:6px 10px;border-radius:8px;color:#aaa;font-size:12px" onclick="window.__BOB__.goSel()">← Retour</button>
        <div class="logo" style="font-size:20px">
          <span class="b1" style="color:var(--yl)">CUISINE</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${pending > 0 ? `
          <span style="background:var(--rd);color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:11px;padding:3px 10px;border-radius:20px">
            ${pending} en attente
          </span>
        ` : ''}
        ${isAdmin() ? `<button style="background:transparent;border:1.5px solid #444;padding:5px 10px;border-radius:8px;color:#aaa;font-size:11px" onclick="window.__BOB__.goAdm()">⚙️</button>` : ''}
        <button style="background:transparent;border:1.5px solid #444;padding:5px 10px;border-radius:8px;color:#aaa;font-size:11px" onclick="window.__BOB__.toggleDark()">${A.dark ? '☀️' : '🌙'}</button>
        <button style="background:transparent;border:1.5px solid #444;padding:5px 10px;border-radius:8px;color:#aaa;font-size:11px" onclick="window.__BOB__.logout()">↩</button>
      </div>
    </div>`;
}

// ── Commandes à traiter ────────────────────────────────────
function bKOrders() {
  const orders = [...A.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!orders.length) {
    return `<div style="padding:40px 20px;text-align:center;color:var(--mt);font-size:14px">Aucune commande reçue</div>`;
  }

  return `
    <div style="padding:14px">
      ${orders.map(o => {
        const st   = ORDER_STATUSES[o.status] || {};
        const open = A['oO_' + o.id];
        const editing = !!A['eQ_' + o.id];

        return `
          <div class="card" style="border-left:4px solid ${o.shopColor || 'var(--br)'}">
            <!-- Header -->
            <div style="padding:12px 14px;display:flex;align-items:flex-start;justify-content:space-between;cursor:pointer;gap:8px" onclick="window.__BOB__.tO('${o.id}')">
              <div style="min-width:0">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <div style="width:8px;height:8px;border-radius:50%;background:${o.shopColor};flex-shrink:0"></div>
                  <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;letter-spacing:1px;color:var(--bk)">${o.shopName}</span>
                  <span style="font-size:11px;color:var(--mt)">${o.id}</span>
                </div>
                <div style="font-size:11px;color:var(--mt);margin-top:3px">
                  ${fD(o.createdAt)} ${fT(o.createdAt)} · Par ${o.orderedBy}
                </div>
                <div style="font-size:11px;color:var(--mt)">
                  📦 ${fDl(o.delivery)}${o.deliveryTime ? ` · ⏰ ${o.deliveryTime}` : ''}
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                <span class="bdg" style="background:${st.color}22;color:${st.color}">
                  <span class="bdd" style="background:${st.dot}"></span>${st.label}
                </span>
                <span style="color:var(--mt)">${open ? '▲' : '▼'}</span>
              </div>
            </div>

            ${open ? `
              <div style="padding:0 14px 14px;border-top:1px solid var(--br)">
                <!-- Items avec édition éventuelle -->
                ${editing ? `
                  <div style="margin-bottom:10px">
                    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:10px;letter-spacing:3px;color:var(--or);margin-bottom:8px">MODE ÉDITION QUANTITÉS</div>
                    ${(o.items || []).map(i => {
                      const p = gP(i.id);
                      const eq = A['eQ_' + o.id];
                      return `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--br)">
                          <span style="font-size:13px;color:var(--bk);flex:1">${p?.name}</span>
                          <div class="qw">
                            <input class="qi" type="number" value="${eq?.[i.id] ?? i.qty}" min="0" step="${p?.step || 1}"
                              onchange="window.__BOB__.sEQ('${o.id}','${i.id}',this.value)"
                              oninput="window.__BOB__.sEQ('${o.id}','${i.id}',this.value)"
                            />
                            <span style="font-size:11px;color:var(--mt)">${p?.unit}</span>
                          </div>
                        </div>`;
                    }).join('')}
                    <div style="display:flex;gap:8px;margin-top:10px">
                      <button class="bgn" style="flex:1;min-height:42px;font-size:13px" onclick="window.__BOB__.svEQ('${o.id}')">Enregistrer ✓</button>
                      <button class="bsm" style="min-height:42px" onclick="window.__BOB__.cxEQ('${o.id}')">Annuler</button>
                    </div>
                  </div>
                ` : `
                  ${(o.items || []).map(i => {
                    const p = gP(i.id);
                    return `
                      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--br)">
                        <span style="font-size:13px;color:var(--bk)">${p?.name || i.id}</span>
                        <span style="font-size:13px;font-weight:700;color:var(--bk)">${i.qty} ${p?.unit || ''}</span>
                      </div>`;
                  }).join('')}
                `}

                ${o.note ? `<div style="margin-top:8px;font-size:12px;color:var(--mt);font-style:italic">💬 ${o.note}</div>` : ''}

                <!-- Commentaire cuisine -->
                ${!editing ? `
                  <div style="margin-top:10px">
                    <textarea
                      class="taf"
                      rows="2"
                      placeholder="Commentaire cuisine (optionnel)..."
                      oninput="window.__BOB__.sOC('${o.id}',this.value)"
                      onblur="window.__BOB__.saveComment('${o.id}')"
                    >${o.comment || ''}</textarea>
                  </div>
                ` : ''}

                <!-- Actions selon statut -->
                ${!editing ? `
                  <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
                    ${o.status === 'pending' ? `
                      <button class="bgn" style="flex:1;min-height:42px;font-size:12px" onclick="window.__BOB__.sOS('${o.id}','preparing')">🔧 En préparation</button>
                      <button class="brd" style="flex:1;min-height:42px" onclick="window.__BOB__.cfR('${o.id}')">Refuser</button>
                      <button class="bgh" style="min-height:42px;font-size:12px" onclick="window.__BOB__.stEQ('${o.id}')">✏️ Qté</button>
                    ` : ''}
                    ${o.status === 'preparing' ? `
                      <button class="bgn" style="flex:1;min-height:42px;font-size:12px" onclick="window.__BOB__.cfV('${o.id}')">✓ Valider</button>
                      <button style="flex:1;min-height:42px;font-size:12px;background:var(--bl);color:#fff;border:none;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-weight:900;letter-spacing:1px" onclick="window.__BOB__.sOS('${o.id}','delivering')">🚚 En livraison</button>
                      <button class="bgh" style="min-height:42px;font-size:12px" onclick="window.__BOB__.stEQ('${o.id}')">✏️ Qté</button>
                    ` : ''}
                    ${o.status === 'validated' || o.status === 'delivering' ? `
                      <span style="font-size:12px;color:var(--mt);padding:10px 0">
                        ${o.validatedBy ? `Validée par ${o.validatedBy}` : ''}
                      </span>
                    ` : ''}
                    ${o.status === 'received' ? `
                      <span style="font-size:12px;color:var(--gn);font-weight:600">✓ Réceptionnée</span>
                    ` : ''}
                    ${o.status === 'rejected' ? `
                      <span style="font-size:12px;color:var(--rd);font-weight:600">✗ Refusée${o.validatedBy ? ` par ${o.validatedBy}` : ''}</span>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

// ── Stock cuisine ──────────────────────────────────────────
function bKStock() {
  const cats = oCats();
  const lows = getLowStock('kitchen');

  return `
    <div style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        ${lows.length > 0 ? `
          <div style="background:#FFF3CD;border:1px solid var(--yl);border-radius:10px;padding:10px 14px;flex:1;display:flex;align-items:center;gap:8px">
            <span style="font-size:16px">⚠️</span>
            <span style="font-size:13px;font-weight:600;color:#856404">${lows.length} alerte${lows.length > 1 ? 's' : ''} stock</span>
          </div>
        ` : `
          <div style="background:var(--lgn);border:1px solid var(--gn);border-radius:10px;padding:10px 14px;flex:1">
            <span style="font-size:13px;font-weight:600;color:var(--gn)">✓ Stocks OK</span>
          </div>
        `}
        <button class="bsm" style="min-height:42px" onclick="window.__BOB__.prtPDF()">📄 Bon de besoin</button>
      </div>

      ${cats.map(cat => {
        const prods = aP().filter(p => p.cat === cat);
        return `
          ${cSec(cat)}
          ${prods.map(p => {
            const s   = (A.stock.kitchen || {})[p.id] || { qty: 0, alert: 0 };
            const low = s.qty <= s.alert;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--br);background:${low ? '#FFF8F0' : 'var(--bg2)'}">
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px;color:var(--bk)">${p.name}</div>
                  <div style="font-size:11px;color:var(--mt);margin-top:2px">
                    Seuil : <input
                      type="number"
                      value="${s.alert}"
                      min="0"
                      style="width:52px;border:1px solid var(--br);border-radius:4px;padding:2px 4px;font-size:11px;background:var(--bg2);color:var(--bk)"
                      onchange="window.__BOB__.uSt('kitchen','${p.id}','alert',this.value)"
                    /> ${p.unit}
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="qw">
                    <button class="qb" style="width:32px;height:32px;font-size:16px" onclick="window.__BOB__.uSt('kitchen','${p.id}','qty',Math.max(0,${s.qty}-${p.step}))">−</button>
                    <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:${low ? 'var(--rd)' : 'var(--gn)'};min-width:48px;text-align:center">${s.qty}</span>
                    <button class="qb" style="width:32px;height:32px;font-size:16px" onclick="window.__BOB__.uSt('kitchen','${p.id}','qty',${s.qty}+${p.step})">+</button>
                  </div>
                  <span style="font-size:11px;color:var(--mt)">${p.unit}</span>
                </div>
              </div>`;
          }).join('')}`;
      }).join('')}
    </div>`;
}

// ── Réceptions fournisseur ─────────────────────────────────
function bKReceipts() {
  const cats = oCats();

  return `
    <div style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;letter-spacing:2px;color:var(--bk)">RÉCEPTIONS FOURNISSEUR</div>
        <button class="bsm" style="background:var(--gn);color:#fff;border:none;min-height:40px" onclick="window.__BOB__.tARc()">+ Réception</button>
      </div>

      ${A.addRc ? `
        <div style="background:var(--gy);border:1px solid var(--br);border-radius:12px;padding:16px;margin-bottom:16px">
          <input class="inf" placeholder="Nom du fournisseur" oninput="window.__BOB__.sRS(this.value)" style="margin-bottom:12px"/>
          <div class="tbr" style="margin-bottom:10px;background:transparent">
            ${cats.map(c => `
              <button class="tb${A.rcCat === c ? ' on' : ''}" onclick="window.__BOB__.sRCat('${c}')" style="font-size:10px">${c}</button>
            `).join('')}
          </div>
          ${aP().filter(p => p.cat === A.rcCat).map(p => `
            <div class="pr">
              <span class="pn">${p.name} <span class="pu">${p.unit}</span></span>
              <input class="qi" type="number" value="${A.rcForm?.cart?.[p.id] || 0}" min="0" step="${p.step}"
                onchange="window.__BOB__.sRC('${p.id}',this.value)"
                oninput="window.__BOB__.sRC('${p.id}',this.value)"
              />
            </div>
          `).join('')}
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="bgn" style="flex:1;min-height:44px" onclick="window.__BOB__.sbRc()">Enregistrer ✓</button>
            <button class="bsm" style="min-height:44px" onclick="window.__BOB__.tARc()">Annuler</button>
          </div>
        </div>
      ` : ''}

      <!-- Historique réceptions -->
      ${A.receipts.map(r => `
        <div class="card" style="cursor:pointer" onclick="window.__BOB__.tRc('${r.id}')">
          <div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--bk)">${r.supplier}</div>
              <div style="font-size:11px;color:var(--mt);margin-top:2px">${fD(r.createdAt)} · ${r.receivedBy}</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:14px;color:var(--gn)">${r.items?.length || 0} produits</div>
              <div style="font-size:11px;color:var(--mt)">${A['oRc_' + r.id] ? '▲' : '▼'}</div>
            </div>
          </div>
          ${A['oRc_' + r.id] ? `
            <div style="padding:0 14px 14px;border-top:1px solid var(--br)">
              ${(r.items || []).map(i => {
                const p = gP(i.id);
                return `
                  <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--br)">
                    <span style="font-size:13px">${p?.name || i.id}</span>
                    <span style="font-size:13px;font-weight:700">${i.qty} ${p?.unit || ''}</span>
                  </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}

      ${!A.receipts.length ? `
        <div style="text-align:center;color:var(--mt);font-size:14px;padding:30px 0">Aucune réception enregistrée</div>
      ` : ''}
    </div>`;
}

// ── Vue cuisine principale ─────────────────────────────────
export function bKitchen() {
  const tabs = [
    { id: 'orders',   label: '📋 Commandes' },
    { id: 'stock',    label: '📦 Stock cuisine' },
    { id: 'receipts', label: '🚛 Réceptions' },
  ];

  let content = '';
  switch (A.kTab) {
    case 'orders':   content = bKOrders();   break;
    case 'stock':    content = bKStock();    break;
    case 'receipts': content = bKReceipts(); break;
    default:         content = bKOrders();
  }

  return `
    <div class="page" style="background:${A.dark ? 'var(--bg)' : '#111'}">
      ${bKitchenHeader()}
      <div style="background:var(--bg);flex:1;display:flex;flex-direction:column">
        <div class="tbr" style="background:#1a1a1a;border-color:#333">
          ${tabs.map(t => `
            <button class="tb dk${A.kTab === t.id ? ' on' : ''}" onclick="window.__BOB__.sKTb('${t.id}')">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <div class="main-content">${content}</div>
      </div>
    </div>`;
}

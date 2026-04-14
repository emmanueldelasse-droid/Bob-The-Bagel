/* ============================================================
   BOBtheBAGEL — js/modules/stock.js
   Stock · Alertes · Export PDF bon de besoin
   ============================================================ */

import { A, sv }                        from '../state.js';
import { gId, nISO, aP, toast, render } from '../utils.js';

// ── Mise à jour stock ──────────────────────────────────────
/**
 * Met à jour un champ (qty ou alert) d'un produit dans un stock donné.
 * @param {string} sid  - ID entité : shop ID ou 'kitchen'
 * @param {string} pid  - ID produit
 * @param {string} field - 'qty' ou 'alert'
 * @param {number|string} val
 */
export function uSt(sid, pid, field, val) {
  const ns = JSON.parse(JSON.stringify(A.stock));
  if (!ns[sid])       ns[sid]       = {};
  if (!ns[sid][pid])  ns[sid][pid]  = { qty: 0, alert: 10 };

  const parsed = parseInt(val) || 0;
  ns[sid][pid][field] = Math.max(0, parsed); // pas de stock négatif

  A.stock = ns;
  sv('st', A.stock);

  A.sLog = [
    { time: nISO(), reason: `MAJ ${field} ${pid} (${sid})`, user: A.cUser?.name },
    ...A.sLog,
  ].slice(0, 100);
  sv('sl', A.sLog);
}

// ── Toggle log stock ───────────────────────────────────────
export function tSL() {
  A.showSL = !A.showSL;
  render();
}

// ── Alertes ────────────────────────────────────────────────
/**
 * Retourne les produits en dessous du seuil d'alerte pour une entité.
 * @param {string} entityId - shop ID ou 'kitchen'
 */
export function getLowStock(entityId) {
  const entityStock = A.stock[entityId] || {};
  return aP().filter(p => {
    const s = entityStock[p.id];
    return s && s.qty <= s.alert;
  });
}

/**
 * Retourne le niveau de stock d'un produit pour une entité.
 * @returns {'ok'|'low'|'empty'}
 */
export function stockLevel(entityId, productId) {
  const s = (A.stock[entityId] || {})[productId];
  if (!s) return 'empty';
  if (s.qty === 0) return 'empty';
  if (s.qty <= s.alert) return 'low';
  return 'ok';
}

// ── Réceptions fournisseur ─────────────────────────────────
export function tARc() {
  A.addRc  = !A.addRc;
  A.rcForm = { sup: '', cart: {} };
  A.rcCat  = 'PAINS';
  render();
}

export function sRS(v) {
  if (!A.rcForm) A.rcForm = { sup: '', cart: {} };
  A.rcForm.sup = v;
}

export function sRC(id, val) {
  if (!A.rcForm) A.rcForm = { sup: '', cart: {} };
  A.rcForm.cart[id] = Math.max(0, parseInt(val) || 0);
  render();
}

export function sbRc() {
  const f = A.rcForm || {};
  if (!f.sup?.trim()) { toast('Nom du fournisseur requis', 'error'); return; }

  const items = aP()
    .filter(p => (f.cart?.[p.id] || 0) > 0)
    .map(p => ({ id: p.id, qty: f.cart[p.id] }));

  if (!items.length) { toast('Aucun produit sélectionné', 'error'); return; }

  const receipt = {
    id:         gId('REC'),
    supplier:   f.sup,
    items,
    createdAt:  nISO(),
    receivedBy: A.cUser?.name,
  };

  const ns = JSON.parse(JSON.stringify(A.stock));
  if (!ns.kitchen) ns.kitchen = {};
  items.forEach(i => {
    if (!ns.kitchen[i.id]) ns.kitchen[i.id] = { qty: 0, alert: 0 };
    ns.kitchen[i.id].qty += i.qty;
  });

  A.stock    = ns;
  A.receipts = [receipt, ...A.receipts];
  sv('st', ns);
  sv('rc', A.receipts);

  A.sLog = [{ time: nISO(), reason: `Réception: ${f.sup}`, user: A.cUser?.name }, ...A.sLog].slice(0, 100);
  sv('sl', A.sLog);

  A.addRc = false;
  A.rcForm = { sup: '', cart: {} };
  toast(`Réception ${f.sup} ✓`);
  render();
}

// ── Export PDF bon de besoin ────────────────────────────────
export function prtPDF() {
  const ks  = A.stock.kitchen || {};
  const all = aP();
  const alerts = all.filter(p => { const s = ks[p.id]; return s && s.qty <= s.alert; });

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const rows = all.map(p => {
    const s   = ks[p.id] || { qty: 0, alert: 0 };
    const low = s.qty <= s.alert;
    return `
      <tr style="background:${low ? '#fff5f5' : '#fff'}">
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">${p.cat}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;font-weight:bold">${p.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;color:${low ? '#E8294B' : '#1B5E3B'};font-weight:bold">${s.qty} ${p.unit}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;color:#888">${s.alert} ${p.unit}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${low ? '⚠️ COMMANDER' : ''}</td>
      </tr>`;
  }).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Bon de Besoin</title></head><body style="padding:30px;font-family:Arial">
    <div style="display:flex;justify-content:space-between;border-bottom:3px solid #1B5E3B;padding-bottom:16px;margin-bottom:20px">
      <div>
        <h1 style="color:#1B5E3B;margin:0;font-size:28px">BOB<em style="color:#E8294B">the</em>BAGEL</h1>
        <p style="color:#888;font-size:13px;margin:4px 0">BON DE BESOIN — CUISINE CENTRALE</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:13px;color:#888;margin:0">${today}</p>
        ${alerts.length > 0 ? `<p style="color:#E8294B;font-weight:bold;font-size:13px;margin:4px 0">⚠ ${alerts.length} produit(s) en alerte</p>` : ''}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#1B5E3B;color:#fff">
          <th style="padding:10px;text-align:left;font-size:12px">CATÉGORIE</th>
          <th style="padding:10px;text-align:left;font-size:12px">PRODUIT</th>
          <th style="padding:10px;text-align:right;font-size:12px">STOCK</th>
          <th style="padding:10px;text-align:right;font-size:12px">SEUIL</th>
          <th style="padding:10px;text-align:center;font-size:12px">ACTION</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.print();window.close();<\/script>
  </body></html>`);
  win.document.close();
}

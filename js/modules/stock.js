/* ============================================================
   BOBtheBAGEL — js/modules/stock.js
   Stock · Alertes · Export PDF bon de besoin
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, nISO, aP, toast, render } from '../utils.js';
import { loadStockIntoState, updateStock as updateStockApi } from '../api/supabase.js';

async function refreshStock(entityIds = null) {
  await loadStockIntoState(entityIds);
}

async function persistStockField(sid, pid, field, val, opts = {}) {
  const parsed = Math.max(0, parseInt(val) || 0);

  try {
    await updateStockApi(sid, pid, field, parsed);

    const ns = JSON.parse(JSON.stringify(A.stock));
    if (!ns[sid]) ns[sid] = {};
    if (!ns[sid][pid]) ns[sid][pid] = { qty: 0, alert: 10 };
    ns[sid][pid][field] = parsed;
    A.stock = ns;

    if (opts.refresh !== false) {
      await refreshStock([sid]);
    }

    A.sLog = [
      { time: nISO(), reason: `MAJ ${field} ${pid} (${sid})`, user: A.cUser?.name },
      ...A.sLog,
    ].slice(0, 100);
    sv('sl', A.sLog);

    render();
    return parsed;
  } catch (error) {
    console.warn('[BOB] stock update failed:', error);
    toast(error?.message || 'Mise à jour stock impossible', 'error');
    render();
    return null;
  }
}

export async function uSt(sid, pid, field, val) {
  await persistStockField(sid, pid, field, val);
}

export function tSL() {
  A.showSL = !A.showSL;
  render();
}

export function getLowStock(entityId) {
  const entityStock = A.stock[entityId] || {};
  return aP().filter((p) => {
    const s = entityStock[p.id];
    return s && s.qty <= s.alert;
  });
}

export function stockLevel(entityId, productId) {
  const s = (A.stock[entityId] || {})[productId];
  if (!s) return 'empty';
  if (s.qty === 0) return 'empty';
  if (s.qty <= s.alert) return 'low';
  return 'ok';
}

export function tARc() {
  A.addRc = !A.addRc;
  A.rcForm = { sup: '', cart: {} };
  A.rcCat = 'PAINS';
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

export async function sbRc() {
  const f = A.rcForm || {};
  if (!f.sup?.trim()) {
    toast('Nom du fournisseur requis', 'error');
    return;
  }

  const items = aP()
    .filter((p) => (f.cart?.[p.id] || 0) > 0)
    .map((p) => ({ id: p.id, qty: f.cart[p.id] }));

  if (!items.length) {
    toast('Aucun produit sélectionné', 'error');
    return;
  }

  const receipt = {
    id: gId('REC'),
    supplier: f.sup,
    items,
    createdAt: nISO(),
    receivedBy: A.cUser?.name,
  };

  try {
    const nextStock = JSON.parse(JSON.stringify(A.stock));
    if (!nextStock.kitchen) nextStock.kitchen = {};

    for (const item of items) {
      const current = nextStock.kitchen[item.id] || { qty: 0, alert: 0 };
      const nextQty = current.qty + item.qty;
      const nextAlert = current.alert || 0;

      nextStock.kitchen[item.id] = { qty: nextQty, alert: nextAlert };
      await updateStockApi('kitchen', item.id, 'qty', nextQty);
      await updateStockApi('kitchen', item.id, 'alert', nextAlert);
    }

    A.stock = nextStock;
    A.receipts = [receipt, ...A.receipts];
    sv('rc', A.receipts);

    A.sLog = [{ time: nISO(), reason: `Réception: ${f.sup}`, user: A.cUser?.name }, ...A.sLog].slice(0, 100);
    sv('sl', A.sLog);

    A.addRc = false;
    A.rcForm = { sup: '', cart: {} };

    await refreshStock(['kitchen']);
    toast(`Réception ${f.sup} ✓`);
    render();
  } catch (error) {
    console.warn('[BOB] supplier receipt failed:', error);
    toast(error?.message || 'Réception fournisseur impossible', 'error');
    render();
  }
}

export function prtPDF() {
  const ks = A.stock.kitchen || {};
  const all = aP();
  const alerts = all.filter((p) => {
    const s = ks[p.id];
    return s && s.qty <= s.alert;
  });

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const rows = all.map((p) => {
    const s = ks[p.id] || { qty: 0, alert: 0 };
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

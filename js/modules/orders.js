/* ============================================================
   BOBtheBAGEL — js/modules/orders.js
   Logique commandes : création, statuts, validation, réception
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, nISO, dDel, toast, alog, render, isValidDelivery } from '../utils.js';
import { createOrder as createOrderApi, loadOrdersIntoState, patchOrder, updateStock as updateStockApi, loadStockIntoState } from '../api/supabase.js';

function currentTimestamp() {
  return nISO();
}

async function refreshOrders() {
  await loadOrdersIntoState();
}

async function persistOrderPatch(id, patch, successMessage = '') {
  try {
    await patchOrder(id, {
      ...patch,
      updatedAt: currentTimestamp(),
      modifiedBy: patch.modifiedBy ?? A.cUser?.name ?? null,
    });
    await refreshOrders();
    if (successMessage) toast(successMessage);
    render();
    return true;
  } catch (error) {
    console.warn('[BOB] order patch failed:', error);
    toast(error?.message || 'Mise à jour impossible', 'error');
    render();
    return false;
  }
}

export function sCart(id, val) {
  A.cart[id] = Math.max(0, parseInt(val) || 0);
  render();
}

export function qAdd(id) {
  const p = A.products.find((prod) => prod.id === id);
  if (!p) return;
  A.cart[id] = (A.cart[id] || 0) + p.step;
  render();
}

export function sNote(v) { A.note = v; }
export function sDel(v)  { A.del = v; }
export function sDelT(v) { A.delT = v; }

export function oSum() {
  const items = A.products
    .filter((p) => p.active && (A.cart[p.id] || 0) > 0)
    .map((p) => ({ id: p.id, qty: A.cart[p.id] }));

  if (!items.length) {
    toast('Panier vide', 'warn');
    return;
  }

  const deliveryDate = A.del || dDel();
  if (!isValidDelivery(deliveryDate)) {
    toast('Date de livraison invalide', 'error');
    return;
  }

  A.summary = { items, del: deliveryDate, delT: A.delT, note: A.note, type: 'shop' };
  render();
}

export function cxSum() {
  A.summary = null;
  render();
}

export async function sbO() {
  const s = A.summary;
  if (!s) return;

  const sh = A.selShop;
  const now = currentTimestamp();
  const order = {
    id: gId('CMD'),
    shopId: sh.id,
    shopName: sh.name,
    shopColor: sh.color,
    items: s.items,
    note: s.note,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    delivery: s.del,
    deliveryTime: s.delT,
    orderedBy: A.cUser?.name || '',
    validatedBy: null,
    comment: null,
  };

  try {
    await createOrderApi(order);
    await refreshOrders();

    A.cart = {};
    A.note = '';
    A.summary = null;
    A.sTab = 'orders';

    alog(`Commande: ${order.id}`);
    toast('Commande envoyée ✓');
    render();
  } catch (error) {
    console.warn('[BOB] createOrder failed:', error);
    toast(error?.message || 'Envoi de la commande impossible', 'error');
    render();
  }
}

export function dupeO(id) {
  const o = A.orders.find((order) => order.id === id);
  if (!o) return;
  A.cart = (o.items || []).reduce((acc, item) => ({ ...acc, [item.id]: item.qty }), {});
  A.sTab = 'order';
  toast('Commande dupliquée ✓');
  render();
}

export async function sOS(id, status) {
  const labels = { preparing: 'En préparation 🔧', delivering: 'En livraison 🚚' };
  const ok = await persistOrderPatch(id, { status }, labels[status] || 'Statut mis à jour ✓');
  if (ok) alog(`Statut ${id}: ${status}`);
}

export function sOC(id, v) {
  A.orders = A.orders.map((o) => (o.id === id ? { ...o, comment: v } : o));
}

export async function saveComment(id) {
  const order = A.orders.find((o) => o.id === id);
  if (!order) return;
  await persistOrderPatch(id, { comment: order.comment || '' });
}

export async function uOD(id, v) {
  if (!isValidDelivery(v)) {
    toast('Date invalide', 'error');
    return;
  }
  await persistOrderPatch(id, { delivery: v }, 'Date mise à jour ✓');
}

export async function uOT(id, v) {
  await persistOrderPatch(id, { deliveryTime: v });
}

export function cfV(id) {
  A.confirm = {
    msg: 'Valider cette commande ?',
    fn: async () => {
      const comment = A.orders.find((o) => o.id === id)?.comment || '';
      const ok = await persistOrderPatch(id, {
        status: 'validated',
        validatedBy: A.cUser?.name || null,
        comment,
      }, 'Validée ✓');
      if (ok) alog(`Validé: ${id}`);
    },
  };
  render();
}

export function cfR(id) {
  A.confirm = {
    msg: 'Refuser cette commande ?',
    fn: async () => {
      const comment = A.orders.find((o) => o.id === id)?.comment || '';
      const ok = await persistOrderPatch(id, {
        status: 'rejected',
        validatedBy: A.cUser?.name || null,
        comment,
      }, 'Refusée ✗');
      if (ok) alog(`Refusé: ${id}`);
    },
  };
  render();
}

export function cfSRc(id) {
  const order = A.orders.find((o) => o.id === id);
  if (!order || order.status === 'received') {
    toast('Déjà réceptionnée', 'warn');
    return;
  }

  A.confirm = {
    msg: 'Confirmer la réception de cette commande ?',
    fn: async () => {
      try {
        await patchOrder(id, {
          status: 'received',
          updatedAt: currentTimestamp(),
          modifiedBy: A.cUser?.name || null,
        });

        const ns = JSON.parse(JSON.stringify(A.stock));
        if (!ns[order.shopId]) ns[order.shopId] = {};

        for (const item of order.items || []) {
          const current = ns[order.shopId][item.id] || { qty: 0, alert: 10 };
          const nextQty = current.qty + item.qty;
          const nextAlert = current.alert ?? 10;
          ns[order.shopId][item.id] = { qty: nextQty, alert: nextAlert };
          await updateStockApi(order.shopId, item.id, 'qty', nextQty);
          await updateStockApi(order.shopId, item.id, 'alert', nextAlert);
        }

        A.stock = ns;
        sv('st', A.stock);

        A.sLog = [{ time: currentTimestamp(), reason: `Réception ${id}`, user: A.cUser?.name }, ...A.sLog].slice(0, 100);
        sv('sl', A.sLog);

        await refreshOrders();
        await loadStockIntoState([order.shopId]);
        toast('Réception confirmée 📦');
        render();
      } catch (error) {
        console.warn('[BOB] receive order failed:', error);
        toast(error?.message || 'Réception impossible', 'error');
        render();
      }
    },
  };
  render();
}

export function cfKRc(id) {
  const ksend = A.ksends.find((k) => k.id === id);
  if (!ksend || ksend.status === 'received') {
    toast('Déjà réceptionnée', 'warn');
    return;
  }

  const sid = A.selShop?.id;
  A.confirm = {
    msg: 'Confirmer la réception ?',
    fn: () => {
      const ns = JSON.parse(JSON.stringify(A.stock));
      if (!ns[sid]) ns[sid] = {};

      (ksend.items || []).forEach((i) => {
        if (!ns[sid][i.id]) ns[sid][i.id] = { qty: 0, alert: 10 };
        ns[sid][i.id].qty += i.qty;
      });

      A.ksends = A.ksends.map((x) => (x.id === id ? { ...x, status: 'received' } : x));
      A.stock = ns;
      sv('ks', A.ksends);
      sv('st', A.stock);
      toast('Réception confirmée 📦');
      render();
    },
  };
  render();
}

export function stEQ(id) {
  A['eQ_' + id] = (A.orders.find((o) => o.id === id)?.items || [])
    .reduce((acc, item) => ({ ...acc, [item.id]: item.qty }), {});
  render();
}

export function sEQ(id, iid, v) {
  if (!A['eQ_' + id]) return;
  A['eQ_' + id][iid] = Math.max(0, parseInt(v) || 0);
}

export async function svEQ(id) {
  const eq = A['eQ_' + id];
  const order = A.orders.find((o) => o.id === id);
  if (!eq || !order) return;

  const items = (order.items || []).map((item) => ({ ...item, qty: eq[item.id] ?? item.qty }));
  const ok = await persistOrderPatch(id, { items }, 'Quantités mises à jour ✓');
  if (ok) delete A['eQ_' + id];
  render();
}

export function cxEQ(id) {
  delete A['eQ_' + id];
  render();
}

export function tO(id)  { A['oO_' + id]  = !A['oO_' + id]; render(); }
export function tKS(id) { A['oKS_' + id] = !A['oKS_' + id]; render(); }
export function tRc(id) { A['oRc_' + id] = !A['oRc_' + id]; render(); }

export async function okCf() {
  if (A.confirm?.fn) await A.confirm.fn();
  A.confirm = null;
  render();
}

export function cxCf() {
  A.confirm = null;
  render();
}

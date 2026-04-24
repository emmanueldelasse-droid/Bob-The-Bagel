/* ============================================================
   BOBtheBAGEL — js/modules/orders.js
   Logique commandes : création, statuts, validation, réception
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, nISO, dDel, toast, alog, render, isValidDelivery } from '../utils.js';
import { createOrder as createOrderApi, loadOrdersIntoState, patchOrder, updateStock as updateStockApi, loadStockIntoState } from '../api/supabase.js';
import { createNotification } from './notifications.js';
import { uploadPhoto } from '../api/supabase.js';

const RESERVE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

function compressImageToDataUrl(file, maxDim = 1024, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read fail'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image load fail'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (error) {
          reject(error);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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
  if (ok) {
    alog(`Statut ${id}: ${status}`);
    const order = A.orders.find((o) => o.id === id);
    notifyTeamBTBStatus(order, status);
  }
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

function shopLabel(shopId) {
  return (A.shops || []).find((s) => s.id === shopId)?.name || shopId;
}

function notifyTeamBTBStatus(order, status, commentMaybe = '') {
  if (!order) return;
  const titles = {
    validated:  'Commande validée',
    rejected:   'Commande refusée',
    preparing:  'Commande en préparation',
    delivering: 'Commande en livraison',
  };
  const title = titles[status];
  if (!title) return;
  const by = A.cUser?.name || 'Cuisine';
  const body = `${shopLabel(order.shopId)} · ${order.id}\n${by}${commentMaybe ? `\n${commentMaybe}` : ''}`;
  createNotification({
    type: `order-${status}`,
    role: 'user',
    title,
    body,
    shopId: order.shopId,
    orderId: order.id,
  });
}

export function cfV(id) {
  A.confirm = {
    msg: 'Valider cette commande ?',
    fn: async () => {
      const order = A.orders.find((o) => o.id === id);
      const comment = order?.comment || '';
      const ok = await persistOrderPatch(id, {
        status: 'validated',
        validatedBy: A.cUser?.name || null,
        comment,
      }, 'Validée ✓');
      if (ok) {
        alog(`Validé: ${id}`);
        notifyTeamBTBStatus(order, 'validated', comment);
      }
    },
  };
  render();
}

export function cfR(id) {
  A.confirm = {
    msg: 'Refuser cette commande ?',
    fn: async () => {
      const order = A.orders.find((o) => o.id === id);
      const comment = order?.comment || '';
      const ok = await persistOrderPatch(id, {
        status: 'rejected',
        validatedBy: A.cUser?.name || null,
        comment,
      }, 'Refusée ✗');
      if (ok) {
        alog(`Refusé: ${id}`);
        notifyTeamBTBStatus(order, 'rejected', comment);
      }
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

// ── Réserve à la réception (Team BTB → notif Manager) ────────
export function openReserveDraft(orderId) {
  const order = A.orders.find((o) => o.id === orderId);
  if (!order) return;
  A.reserveDraft = {
    orderId,
    note: '',
    photos: [],
    items: (order.items || []).map((it) => ({ id: it.id, expected: it.qty, actual: it.qty })),
  };
  render();
}

export function triggerReservePhotoInput() {
  document.getElementById('reserve-photo-input')?.click();
}

export async function handleReservePhotoChange(event) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;
  try {
    if (!A.reserveDraft) return;
    if (!file.type?.startsWith('image/')) { toast('Fichier non image', 'error'); return; }
    if (file.size > RESERVE_PHOTO_MAX_BYTES) { toast('Image trop lourde (max 2 Mo)', 'error'); return; }

    let url = null;
    try {
      const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `reception/${A.reserveDraft.orderId}/${Date.now()}-${gId('P')}.${ext}`;
      url = await uploadPhoto(file, path, 'reception-photos');
    } catch (error) {
      console.warn('[BOB] reserve photo upload failed, compressing to data URL fallback:', error);
      url = await compressImageToDataUrl(file, 1024, 0.72);
    }
    A.reserveDraft.photos = [...(A.reserveDraft.photos || []), url];
    render();
  } catch (error) {
    console.warn('[BOB] handleReservePhotoChange:', error);
    toast('Ajout photo impossible', 'error');
  } finally {
    if (input) input.value = '';
  }
}

export function removeReservePhoto(index) {
  if (!A.reserveDraft) return;
  A.reserveDraft.photos = (A.reserveDraft.photos || []).filter((_, i) => i !== index);
  render();
}

export function setReserveItem(itemId, field, value) {
  if (!A.reserveDraft) return;
  const v = Math.max(0, parseInt(value) || 0);
  A.reserveDraft.items = A.reserveDraft.items.map((i) =>
    i.id === itemId ? { ...i, [field]: v } : i
  );
}

export function setReserveNote(value) {
  if (!A.reserveDraft) return;
  A.reserveDraft.note = String(value || '').slice(0, 600);
}

export function cancelReserveDraft() {
  A.reserveDraft = null;
  render();
}

export async function submitReserve() {
  const draft = A.reserveDraft;
  if (!draft?.orderId) return;
  const order = A.orders.find((o) => o.id === draft.orderId);
  if (!order) { toast('Commande introuvable', 'error'); return; }

  const deltas = draft.items
    .map((i) => ({ id: i.id, expected: i.expected, actual: i.actual, delta: i.actual - i.expected }))
    .filter((i) => i.delta !== 0);

  if (!deltas.length && !draft.note.trim()) {
    toast('Renseigne un manquant ou une note', 'warn');
    return;
  }

  const reservation = {
    note: draft.note.trim(),
    items: deltas,
    photos: Array.isArray(draft.photos) ? draft.photos.slice(0, 6) : [],
    reportedBy: A.cUser?.name || 'Team BTB',
    reportedById: A.cUser?.id || null,
    reportedAt: nISO(),
  };

  try {
    await patchOrder(draft.orderId, {
      status: 'received',
      reservation,
      updatedAt: currentTimestamp(),
      modifiedBy: A.cUser?.name || null,
    });
  } catch (error) {
    console.warn('[BOB] reserve patch failed (fallback local):', error);
  }

  const ns = JSON.parse(JSON.stringify(A.stock));
  if (!ns[order.shopId]) ns[order.shopId] = {};
  for (const item of draft.items) {
    const current = ns[order.shopId][item.id] || { qty: 0, alert: 10 };
    ns[order.shopId][item.id] = { qty: current.qty + (item.actual || 0), alert: current.alert ?? 10 };
    try {
      await updateStockApi(order.shopId, item.id, 'qty', ns[order.shopId][item.id].qty);
    } catch (e) {
      console.warn('[BOB] stock update failed (fallback local):', e);
    }
  }
  A.stock = ns;
  sv('st', A.stock);

  A.orders = A.orders.map((o) =>
    o.id === draft.orderId ? { ...o, status: 'received', reservation } : o
  );
  sv('or', A.orders);

  const shopName = A.shops?.find((s) => s.id === order.shopId)?.name || order.shopId;
  const missingSummary = deltas.length
    ? deltas.map((d) => `${d.id} ${d.delta > 0 ? '+' : ''}${d.delta}`).join(', ')
    : '(note uniquement)';

  createNotification({
    type: 'reserve',
    role: 'admin',
    title: `Réserve à la réception · ${shopName}`,
    body: `${reservation.reportedBy} · ${order.id}\n${missingSummary}${reservation.note ? `\n${reservation.note}` : ''}`,
    shopId: order.shopId,
    orderId: order.id,
  });

  alog(`Réserve ${order.id} par ${reservation.reportedBy}`);
  A.reserveDraft = null;
  toast('Réserve enregistrée · Manager notifié', 'warn');
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

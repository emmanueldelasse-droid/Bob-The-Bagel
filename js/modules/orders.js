/* ============================================================
   BOBtheBAGEL — js/modules/orders.js
   Logique commandes : création, statuts, validation, réception
   ============================================================ */

import { A, sv }                           from '../state.js';
import { gId, nISO, dDel, toast, alog, render, isValidDelivery } from '../utils.js';

// ── Panier boutique ────────────────────────────────────────
export function sCart(id, val) {
  A.cart[id] = Math.max(0, parseInt(val) || 0);
  render();
}

export function qAdd(id) {
  const p = A.products.find(p => p.id === id);
  if (!p) return;
  A.cart[id] = (A.cart[id] || 0) + p.step;
  render();
}

export function sNote(v)  { A.note = v; }
export function sDel(v)   { A.del  = v; }
export function sDelT(v)  { A.delT = v; }

// ── Résumé avant envoi ─────────────────────────────────────
export function oSum() {
  const items = A.products
    .filter(p => p.active && (A.cart[p.id] || 0) > 0)
    .map(p => ({ id: p.id, qty: A.cart[p.id] }));

  if (!items.length) {
    toast('Panier vide', 'warn');
    return;
  }

  // Validation date
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

// ── Envoi commande ─────────────────────────────────────────
export function sbO() {
  const s = A.summary;
  if (!s) return;

  const sh = A.selShop;
  const order = {
    id:           gId('CMD'),
    shopId:       sh.id,
    shopName:     sh.name,
    shopColor:    sh.color,
    items:        s.items,
    note:         s.note,
    status:       'pending',
    createdAt:    nISO(),
    updatedAt:    nISO(),
    delivery:     s.del,
    deliveryTime: s.delT,
    orderedBy:    A.cUser.name,
    validatedBy:  null,
    comment:      null,
  };

  A.orders = [order, ...A.orders];
  sv('or', A.orders);

  A.cart    = {};
  A.note    = '';
  A.summary = null;

  alog(`Commande: ${order.id}`);
  toast('Commande envoyée ✓');
  A.sTab = 'orders'; // bascule sur l'onglet historique
  render();
}

// ── Duplication commande ───────────────────────────────────
export function dupeO(id) {
  const o = A.orders.find(o => o.id === id);
  if (!o) return;
  A.cart  = (o.items || []).reduce((acc, i) => ({ ...acc, [i.id]: i.qty }), {});
  A.sTab  = 'order';
  toast('Commande dupliquée ✓');
  render();
}

// ── Statuts (cuisine) ──────────────────────────────────────
export function sOS(id, status) {
  A.orders = A.orders.map(o =>
    o.id === id ? { ...o, status, updatedAt: nISO(), modifiedBy: A.cUser?.name } : o
  );
  sv('or', A.orders);
  alog(`Statut ${id}: ${status}`);

  const labels = { preparing: 'En préparation 🔧', delivering: 'En livraison 🚚' };
  toast(labels[status] || 'Statut mis à jour ✓');
  render();
}

// ── Commentaire commande ───────────────────────────────────
export function sOC(id, v) {
  A.orders = A.orders.map(o => o.id === id ? { ...o, comment: v } : o);
  // Pas de sv() ni render() ici : saisie live, save au moment de la validation
}

export function saveComment(id) {
  sv('or', A.orders);
}

// ── Mise à jour date de livraison ──────────────────────────
export function uOD(id, v) {
  if (!isValidDelivery(v)) { toast('Date invalide', 'error'); return; }
  A.orders = A.orders.map(o =>
    o.id === id ? { ...o, delivery: v, updatedAt: nISO(), modifiedBy: A.cUser?.name } : o
  );
  sv('or', A.orders);
  toast('Date mise à jour ✓');
}

export function uOT(id, v) {
  A.orders = A.orders.map(o =>
    o.id === id ? { ...o, deliveryTime: v, modifiedBy: A.cUser?.name } : o
  );
  sv('or', A.orders);
}

// ── Validation / Refus (cuisine) ───────────────────────────
export function cfV(id) {
  A.confirm = {
    msg: 'Valider cette commande ?',
    fn: () => {
      const comment = A.orders.find(o => o.id === id)?.comment || '';
      A.orders = A.orders.map(o =>
        o.id === id
          ? { ...o, status: 'validated', updatedAt: nISO(), validatedBy: A.cUser?.name, comment }
          : o
      );
      sv('or', A.orders);
      alog(`Validé: ${id}`);
      toast('Validée ✓');
      render();
    },
  };
  render();
}

export function cfR(id) {
  A.confirm = {
    msg: 'Refuser cette commande ?',
    fn: () => {
      const comment = A.orders.find(o => o.id === id)?.comment || '';
      A.orders = A.orders.map(o =>
        o.id === id
          ? { ...o, status: 'rejected', updatedAt: nISO(), validatedBy: A.cUser?.name, comment }
          : o
      );
      sv('or', A.orders);
      alog(`Refusé: ${id}`);
      toast('Refusée ✗', 'error');
      render();
    },
  };
  render();
}

// ── Réception commande (boutique confirme) ─────────────────
export function cfSRc(id) {
  // Garde contre double-clic
  const order = A.orders.find(o => o.id === id);
  if (!order || order.status === 'received') {
    toast('Déjà réceptionnée', 'warn');
    return;
  }

  A.confirm = {
    msg: 'Confirmer la réception de cette commande ?',
    fn: () => {
      const ns = JSON.parse(JSON.stringify(A.stock));
      if (!ns[order.shopId]) ns[order.shopId] = {};

      (order.items || []).forEach(i => {
        if (!ns[order.shopId][i.id]) ns[order.shopId][i.id] = { qty: 0, alert: 10 };
        ns[order.shopId][i.id].qty += i.qty;
      });

      A.orders = A.orders.map(o =>
        o.id === id ? { ...o, status: 'received', updatedAt: nISO() } : o
      );
      A.stock = ns;
      sv('or', A.orders);
      sv('st', A.stock);

      A.sLog = [{ time: nISO(), reason: `Réception ${id}`, user: A.cUser?.name }, ...A.sLog].slice(0, 100);
      sv('sl', A.sLog);

      toast('Réception confirmée 📦');
      render();
    },
  };
  render();
}

// ── Réception envoi cuisine vers boutique ──────────────────
export function cfKRc(id) {
  const ksend = A.ksends.find(k => k.id === id);
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

      (ksend.items || []).forEach(i => {
        if (!ns[sid][i.id]) ns[sid][i.id] = { qty: 0, alert: 10 };
        ns[sid][i.id].qty += i.qty;
      });

      A.ksends = A.ksends.map(x => x.id === id ? { ...x, status: 'received' } : x);
      A.stock  = ns;
      sv('ks', A.ksends);
      sv('st', A.stock);
      toast('Réception confirmée 📦');
      render();
    },
  };
  render();
}

// ── Ajustement quantités (cuisine) ────────────────────────
export function stEQ(id) {
  A['eQ_' + id] = (A.orders.find(o => o.id === id)?.items || [])
    .reduce((acc, i) => ({ ...acc, [i.id]: i.qty }), {});
  render();
}

export function sEQ(id, iid, v) {
  if (!A['eQ_' + id]) return;
  A['eQ_' + id][iid] = Math.max(0, parseInt(v) || 0);
}

export function svEQ(id) {
  const eq = A['eQ_' + id];
  if (!eq) return;
  A.orders = A.orders.map(o =>
    o.id === id
      ? { ...o, items: (o.items || []).map(i => ({ ...i, qty: eq[i.id] ?? i.qty })), updatedAt: nISO(), modifiedBy: A.cUser?.name }
      : o
  );
  delete A['eQ_' + id];
  sv('or', A.orders);
  toast('Quantités mises à jour ✓');
  render();
}

export function cxEQ(id) {
  delete A['eQ_' + id];
  render();
}

// ── Toggle affichage détail commande ───────────────────────
export function tO(id)  { A['oO_' + id]  = !A['oO_' + id];  render(); }
export function tKS(id) { A['oKS_' + id] = !A['oKS_' + id]; render(); }
export function tRc(id) { A['oRc_' + id] = !A['oRc_' + id]; render(); }

// ── Confirmation générique ─────────────────────────────────
export function okCf() {
  if (A.confirm?.fn) A.confirm.fn();
  A.confirm = null;
  render();
}

export function cxCf() {
  A.confirm = null;
  render();
}

/* ============================================================
   BOBtheBAGEL - js/modules/planning.js
   Planning personnel par boutique
   - shifts stockes en local (A.planning / clef 'pl')
   - CRUD complet Manager, lecture Team BTB dans la vue boutique
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, toast, render, alog, nISO } from '../utils.js';

export const SHIFT_ROLES = [
  'Ouverture',
  'Fermeture',
  'Matin',
  'Apres-midi',
  'Soir',
  'Renfort',
];

function persist() {
  sv('pl', A.planning);
}

function emptyDraft() {
  return {
    id: null,
    shopId: A.selShop?.id || A.planShop || (A.shops?.[0]?.id) || null,
    staffId: '',
    staffName: '',
    date: A.planRefDate || new Date().toISOString().split('T')[0],
    start: '08:00',
    end: '16:00',
    role: SHIFT_ROLES[0],
    note: '',
  };
}

export function setPlanTab(tab) {
  A.planTab = tab === 'month' ? 'month' : 'week';
  render();
}

export function setPlanShopFilter(shopId) {
  A.planShop = shopId || null;
  render();
}

export function setPlanRefDate(dateStr) {
  if (!dateStr) return;
  A.planRefDate = dateStr;
  render();
}

export function shiftPlanRef(deltaDays) {
  const base = new Date(A.planRefDate || new Date().toISOString().split('T')[0]);
  base.setDate(base.getDate() + deltaDays);
  A.planRefDate = base.toISOString().split('T')[0];
  render();
}

export function planToday() {
  A.planRefDate = new Date().toISOString().split('T')[0];
  render();
}

export function enterAdminPlanningContext() {
  A.planContext = 'admin';
  A.planShop = null;
  A.planDraft = null;
}

export function enterShopPlanningContext(shopId) {
  A.planContext = 'shop';
  A.planShop = shopId;
  A.planDraft = null;
}

export function openPlanDraft(shopId) {
  const ctxShop = shopId || A.planShop || A.selShop?.id || null;
  A.planDraft = { ...emptyDraft(), shopId: ctxShop };
  render();
}

export function editPlanShift(id) {
  const shift = (A.planning || []).find((s) => s.id === id);
  if (!shift) return;
  A.planDraft = { ...shift };
  render();
}

export function cancelPlanDraft() {
  A.planDraft = null;
  render();
}

export function setPlanDraft(field, value) {
  if (!A.planDraft) return;
  A.planDraft[field] = value;
  if (field === 'staffId' && value) {
    const user = A.users.find((u) => u.id === value);
    if (user) A.planDraft.staffName = user.name;
  }
}

export function savePlanDraft() {
  const d = A.planDraft;
  if (!d) return;
  if (!d.shopId) { toast('Boutique requise', 'error'); return; }
  if (!d.date) { toast('Date requise', 'error'); return; }
  if (!d.staffName?.trim() && !d.staffId) { toast('Nom requis', 'error'); return; }
  if (!d.start || !d.end) { toast('Horaires requis', 'error'); return; }
  if (d.end <= d.start) { toast('Fin apres debut', 'error'); return; }

  const staffName = d.staffName?.trim() || A.users.find((u) => u.id === d.staffId)?.name || 'Equipe';
  const payload = {
    id: d.id || gId('PL'),
    shopId: d.shopId,
    staffId: d.staffId || null,
    staffName,
    date: d.date,
    start: d.start,
    end: d.end,
    role: d.role || SHIFT_ROLES[0],
    note: (d.note || '').trim(),
    updatedAt: nISO(),
  };

  if (d.id) {
    A.planning = A.planning.map((s) => (s.id === d.id ? payload : s));
    alog(`Planning maj: ${staffName} ${d.date}`);
    toast('Shift mis a jour');
  } else {
    A.planning = [...A.planning, payload];
    alog(`Planning ajout: ${staffName} ${d.date}`);
    toast('Shift ajoute');
  }
  persist();
  A.planDraft = null;
  render();
}

export function deletePlanShift(id) {
  A.confirm = {
    msg: 'Supprimer ce shift ?',
    fn: () => {
      A.planning = (A.planning || []).filter((s) => s.id !== id);
      persist();
      alog(`Planning suppr: ${id}`);
      toast('Supprime', 'error');
      render();
    },
  };
  render();
}

export function shiftsForShop(shopId, fromIso, toIso) {
  return (A.planning || []).filter((s) => {
    if (s.shopId !== shopId) return false;
    if (fromIso && s.date < fromIso) return false;
    if (toIso && s.date > toIso) return false;
    return true;
  }).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

export function weekRange(refDateStr) {
  const ref = new Date(refDateStr);
  const dow = (ref.getDay() + 6) % 7; // Monday-based
  const from = new Date(ref);
  from.setDate(ref.getDate() - dow);
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/* ============================================================
   BOBtheBAGEL - js/modules/planning.js
   Planning personnel par boutique
   - shifts stockes en local (A.planning / clef 'pl')
   - CRUD complet Manager, lecture Team BTB dans la vue boutique
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, toast, render, alog, nISO } from '../utils.js';
import { loadPlanningIntoState, upsertPlanningShift, deletePlanningShiftApi } from '../api/supabase.js';

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
  const today = A.planRefDate || new Date().toISOString().split('T')[0];
  return {
    id: null,
    shopId: A.selShop?.id || A.planShop || (A.shops?.[0]?.id) || null,
    staffId: '',
    staffName: '',
    date: today,
    mode: 'day',
    weekDates: weekRange(today),
    start: '08:00',
    end: '16:00',
    role: SHIFT_ROLES[0],
    note: '',
  };
}

export function setPlanTab(tab) {
  const allowed = ['week', 'month', 'list'];
  A.planTab = allowed.includes(tab) ? tab : 'week';
  render();
}

export function monthRange(refDateStr) {
  const ref = new Date(refDateStr);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based grid
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({
      iso: d.toISOString().split('T')[0],
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      dow: (d.getDay() + 6) % 7,
    });
  }
  return { month, year, days };
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
  // Les shifts existants sont toujours edites en mode 'day' — on ne duplique
  // pas implicitement sur toute la semaine au moment de modifier un jour.
  A.planDraft = { ...shift, mode: 'day', weekDates: weekRange(shift.date) };
  render();
}

export function togglePlanDraftDay(dateIso) {
  if (!A.planDraft) return;
  const list = Array.isArray(A.planDraft.weekDates) ? A.planDraft.weekDates : [];
  if (list.includes(dateIso)) {
    A.planDraft.weekDates = list.filter((d) => d !== dateIso);
  } else {
    A.planDraft.weekDates = [...list, dateIso].sort();
  }
  render();
}

export function setPlanDraftMode(mode) {
  if (!A.planDraft) return;
  A.planDraft.mode = mode === 'week' ? 'week' : 'day';
  if (A.planDraft.mode === 'week' && !Array.isArray(A.planDraft.weekDates)) {
    A.planDraft.weekDates = weekRange(A.planDraft.date);
  }
  render();
}

export function resetPlanDraftWeek() {
  if (!A.planDraft) return;
  A.planDraft.weekDates = weekRange(A.planDraft.date);
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

export async function savePlanDraft() {
  const d = A.planDraft;
  if (!d) return;
  if (!d.shopId) { toast('Boutique requise', 'error'); return; }
  if (!d.staffName?.trim() && !d.staffId) { toast('Nom requis', 'error'); return; }
  if (!d.start || !d.end) { toast('Horaires requis', 'error'); return; }
  if (d.end <= d.start) { toast('Fin apres debut', 'error'); return; }

  const staffName = d.staffName?.trim() || A.users.find((u) => u.id === d.staffId)?.name || 'Equipe';

  // Mode 'week' : on ne l'accepte qu'en creation. En edition (d.id), un shift
  // = un jour — l'utilisateur peut toujours editer chaque jour individuellement.
  const isWeekCreate = !d.id && d.mode === 'week';
  let dates = [];
  if (isWeekCreate) {
    dates = Array.isArray(d.weekDates) ? d.weekDates.filter(Boolean) : [];
    if (!dates.length) { toast('Aucun jour sélectionné', 'error'); return; }
  } else {
    if (!d.date) { toast('Date requise', 'error'); return; }
    dates = [d.date];
  }

  const buildPayload = (date, existingId = null) => ({
    id: existingId || gId('PL'),
    shopId: d.shopId,
    staffId: d.staffId || null,
    staffName,
    date,
    start: d.start,
    end: d.end,
    role: d.role || SHIFT_ROLES[0],
    note: (d.note || '').trim(),
    updatedAt: nISO(),
  });

  if (d.id) {
    // Edition simple d'un shift existant.
    const payload = buildPayload(dates[0], d.id);
    try {
      const saved = await upsertPlanningShift(payload);
      const next = saved || payload;
      A.planning = A.planning.map((s) => (s.id === d.id ? next : s));
      alog(`Planning maj: ${staffName} ${payload.date}`);
      toast('Shift mis à jour');
    } catch (error) {
      console.warn('[BOB] savePlanDraft remote failed, fallback local:', error);
      A.planning = A.planning.map((s) => (s.id === d.id ? payload : s));
      toast('Shift enregistré (hors ligne)', 'warn');
    }
  } else {
    const payloads = dates.map((date) => buildPayload(date));
    A.planning = [...(A.planning || []), ...payloads];
    persist();
    render();

    let remoteOk = 0;
    for (const payload of payloads) {
      try {
        const saved = await upsertPlanningShift(payload);
        if (saved) {
          A.planning = A.planning.map((s) => (s.id === payload.id ? saved : s));
        }
        remoteOk += 1;
      } catch (error) {
        console.warn('[BOB] savePlanDraft remote failed for one day, kept local:', error);
      }
    }
    const label = payloads.length === 1 ? 'Shift ajouté' : `${payloads.length} shifts ajoutés (${remoteOk} en base)`;
    alog(`Planning ajout: ${staffName} × ${payloads.length} (${payloads[0].date} → ${payloads[payloads.length - 1].date})`);
    toast(label);
  }
  persist();
  A.planDraft = null;
  render();
}

export function deletePlanShift(id) {
  A.confirm = {
    msg: 'Supprimer ce shift ?',
    fn: async () => {
      try {
        await deletePlanningShiftApi(id);
      } catch (error) {
        console.warn('[BOB] deletePlanShift remote failed:', error);
      }
      A.planning = (A.planning || []).filter((s) => s.id !== id);
      persist();
      alog(`Planning suppr: ${id}`);
      toast('Supprime', 'error');
      render();
    },
  };
  render();
}

// Trouve les shifts "soeurs" (meme personne, memes horaires, meme boutique) dans
// la semaine de reference — utilise pour proposer la suppression en serie.
export function siblingShiftsForDraft() {
  const d = A.planDraft;
  if (!d?.id) return [];
  const refDate = d.date;
  if (!refDate) return [];
  const days = weekRange(refDate);
  const from = days[0];
  const to = days[6];
  const staffKey = (d.staffName || '').trim().toLowerCase();
  if (!staffKey) return [];
  return (A.planning || []).filter((s) => {
    if (s.id === d.id) return false;
    if (s.shopId !== d.shopId) return false;
    if ((s.staffName || '').trim().toLowerCase() !== staffKey) return false;
    if (s.start !== d.start || s.end !== d.end) return false;
    if (s.date < from || s.date > to) return false;
    return true;
  });
}

export function deletePlanSeries() {
  const d = A.planDraft;
  if (!d?.id) return;
  const siblings = siblingShiftsForDraft();
  const all = [d, ...siblings];
  if (!all.length) return;

  A.confirm = {
    msg: `Supprimer les ${all.length} shifts de ${d.staffName} cette semaine ?`,
    fn: async () => {
      for (const s of all) {
        try {
          await deletePlanningShiftApi(s.id);
        } catch (error) {
          console.warn('[BOB] deletePlanSeries remote failed for one:', error);
        }
      }
      const ids = new Set(all.map((s) => s.id));
      A.planning = (A.planning || []).filter((s) => !ids.has(s.id));
      persist();
      A.planDraft = null;
      alog(`Planning serie suppr: ${d.staffName} (${all.length})`);
      toast(`${all.length} shifts supprimés`, 'error');
      A.confirm = null;
      render();
    },
  };
  render();
}

export { loadPlanningIntoState };

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

function shiftIsoDate(iso, deltaDays) {
  const d = new Date(iso);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split('T')[0];
}

export async function duplicateWeekToNext() {
  const days = weekRange(A.planRefDate);
  const from = days[0];
  const to = days[6];
  const isShopCtx = A.planContext === 'shop';
  const shopFilter = isShopCtx ? (A.selShop?.id || A.planShop) : A.planShop;

  const src = (A.planning || []).filter((s) => {
    if (s.date < from || s.date > to) return false;
    if (shopFilter && s.shopId !== shopFilter) return false;
    return true;
  });

  if (!src.length) {
    toast('Aucun shift à copier cette semaine', 'warn');
    return;
  }

  A.confirm = {
    msg: `Copier ${src.length} shift${src.length > 1 ? 's' : ''} sur la semaine suivante ?`,
    fn: async () => {
      const clones = src.map((s) => ({
        ...s,
        id: gId('PL'),
        date: shiftIsoDate(s.date, 7),
        updatedAt: nISO(),
      }));
      const next = [...(A.planning || []), ...clones];
      A.planning = next;
      persist();
      A.planRefDate = shiftIsoDate(A.planRefDate, 7);
      render();

      let remoteOk = 0;
      for (const clone of clones) {
        try {
          await upsertPlanningShift(clone);
          remoteOk += 1;
        } catch (error) {
          console.warn('[BOB] duplicateWeek remote failed for one shift:', error);
        }
      }
      A.confirm = null;
      toast(`Semaine copiée · ${clones.length} shifts (${remoteOk} remote OK)`);
      alog(`Planning duplique semaine: ${clones.length} shifts`);
      render();
    },
  };
  render();
}

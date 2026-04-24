/* ============================================================
   BOBtheBAGEL — js/modules/calendar.js v2
   Navigation · Duplication · Checklist · Export PDF
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, nISO, render, toast } from '../utils.js';
import { upsertCalendarEvent, deleteCalendarEventApi, loadCalendarIntoState } from '../api/supabase.js';

export { loadCalendarIntoState };

// ── Statuts ────────────────────────────────────────────────
export const EVENT_STATUSES = {
  planned:   { label: 'Planifié',       color: '#2563EB', bg: '#DBEAFE' },
  confirmed: { label: 'Confirmé',       color: '#1A7A4A', bg: '#D1FAE5' },
  preparing: { label: 'En préparation', color: '#D97706', bg: '#FEF3C7' },
  done:      { label: 'Terminé',        color: '#6B6B6B', bg: '#F3F4F6' },
  cancelled: { label: 'Annulé',         color: '#E8294B', bg: '#FEE2E2' },
};

// ── Formulaire vide ────────────────────────────────────────
export function emptyForm() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return {
    title:     '',
    date:      d.toISOString().split('T')[0],
    time:      '12:00',
    location:  '',
    shops:     [],
    status:    'planned',
    covers:    '',
    notes:     '',
    checklist: [],
  };
}

// ── Navigation mensuelle ───────────────────────────────────
export function calNavPrev() {
  if (A.calMonth === 0) { A.calMonth = 11; A.calYear--; }
  else A.calMonth--;
  render();
}

export function calNavNext() {
  if (A.calMonth === 11) { A.calMonth = 0; A.calYear++; }
  else A.calMonth++;
  render();
}

export function calNavToday() {
  const now = new Date();
  A.calMonth = now.getMonth();
  A.calYear  = now.getFullYear();
  render();
}

// ── Formulaire ─────────────────────────────────────────────
export function openCalForm() {
  A.calForm = emptyForm();
  render();
}

export function editEvent(id) {
  const ev = A.events.find(e => e.id === id);
  if (!ev) return;
  A.calForm = {
    ...ev,
    checklist: ev.checklist || [],
    _editing: id,
  };
  render();
}

export function closeCalForm() {
  A.calForm = null;
  render();
}

export function setCalField(field, value) {
  if (!A.calForm) return;
  A.calForm = { ...A.calForm, [field]: value };
  render();
}

export function toggleCalShop(shopId) {
  if (!A.calForm) return;
  const shops = A.calForm.shops || [];
  A.calForm = {
    ...A.calForm,
    shops: shops.includes(shopId)
      ? shops.filter(s => s !== shopId)
      : [...shops, shopId],
  };
  render();
}

// ── Checklist ──────────────────────────────────────────────
export function addCheckItem() {
  if (!A.calForm) return;
  const label = document.getElementById('check-input')?.value?.trim();
  if (!label) return;
  A.calForm = {
    ...A.calForm,
    checklist: [...(A.calForm.checklist || []), { id: gId('CHK'), label, done: false }],
  };
  document.getElementById('check-input').value = '';
  render();
}

export function toggleCheckItem(evId, itemId) {
  A.events = A.events.map(e => {
    if (e.id !== evId) return e;
    return {
      ...e,
      checklist: (e.checklist || []).map(i =>
        i.id === itemId ? { ...i, done: !i.done } : i
      ),
      updatedAt: nISO(),
    };
  });
  sv('ev', A.events);
  render();
}

export function removeCheckItem(itemId) {
  if (!A.calForm) return;
  A.calForm = {
    ...A.calForm,
    checklist: (A.calForm.checklist || []).filter(i => i.id !== itemId),
  };
  render();
}

// ── Sauvegarde ─────────────────────────────────────────────
export async function saveEvent() {
  const f = A.calForm;
  if (!f) return;
  if (!f.title?.trim()) { toast('Titre requis', 'error'); return; }
  if (!f.date)          { toast('Date requise', 'error'); return; }

  const now = nISO();
  let payload;
  if (f._editing) {
    const existing = A.events.find(e => e.id === f._editing) || {};
    payload = { ...existing, ...f, _editing: undefined, updatedAt: now };
  } else {
    payload = {
      id:        gId('EVT'),
      title:     f.title.trim(),
      description: (f.notes || f.description || '').trim(),
      date:      f.date,
      time:      f.time || '',
      endTime:   f.endTime || '',
      location:  f.location?.trim() || '',
      shops:     f.shops || [],
      status:    f.status || 'planned',
      colorTag:  f.colorTag || null,
      eventType: f.eventType || 'generic',
      covers:    f.covers || '',
      notes:     f.notes?.trim() || '',
      checklist: f.checklist || [],
      authorId:  A.cUser?.id || null,
      authorName: A.cUser?.name || '?',
      createdBy: A.cUser?.name || '?',
      createdAt: now,
      updatedAt: now,
    };
  }

  try {
    const saved = await upsertCalendarEvent(payload);
    const next = saved ? { ...payload, ...saved } : payload;
    if (f._editing) {
      A.events = A.events.map(e => e.id === f._editing ? next : e);
      toast('Événement mis à jour ✓');
    } else {
      A.events = [...A.events, next];
      toast('Événement créé ✓');
    }
  } catch (error) {
    console.warn('[BOB] saveEvent remote failed, kept local:', error);
    if (f._editing) {
      A.events = A.events.map(e => e.id === f._editing ? payload : e);
    } else {
      A.events = [...A.events, payload];
    }
    toast('Événement enregistré (hors ligne)', 'warn');
  }

  sv('ev', A.events);
  A.calForm = null;
  render();
}

// ── Duplication ────────────────────────────────────────────
export function duplicateEvent(id) {
  const ev = A.events.find(e => e.id === id);
  if (!ev) return;
  // Date par défaut = 7 jours après l'original
  const d = new Date(ev.date);
  d.setDate(d.getDate() + 7);
  A.calForm = {
    ...ev,
    title:     ev.title + ' (copie)',
    date:      d.toISOString().split('T')[0],
    status:    'planned',
    checklist: (ev.checklist || []).map(i => ({ ...i, done: false })),
    _editing:  undefined,
  };
  render();
  toast('Dupliquer — modifiez et sauvegardez ✓', 'warn');
}

// ── Suppression ────────────────────────────────────────────
export function deleteEvent(id) {
  A.confirm = {
    msg: 'Supprimer cet événement ?',
    fn: async () => {
      try {
        await deleteCalendarEventApi(id);
      } catch (error) {
        console.warn('[BOB] deleteEvent remote failed:', error);
      }
      A.events = A.events.filter(e => e.id !== id);
      sv('ev', A.events);
      toast('Supprimé', 'error');
      render();
    },
  };
  render();
}

// ── Statut rapide ──────────────────────────────────────────
export async function setEventStatus(id, status) {
  const existing = A.events.find(e => e.id === id);
  if (!existing) return;
  const next = { ...existing, status, updatedAt: nISO() };
  A.events = A.events.map(e => e.id === id ? next : e);
  sv('ev', A.events);
  render();
  try {
    await upsertCalendarEvent(next);
  } catch (error) {
    console.warn('[BOB] setEventStatus remote failed:', error);
  }
}

// ── Filtres & tabs ─────────────────────────────────────────
export function setCalFilter(v)    { A.calFilter    = v; render(); }
export function setCalTab(v)       { A.calTab       = v; render(); }
export function setCalColorMode(v) { A.calColorMode = v; render(); }

// ── Badge (événements dans les 7 prochains jours) ──────────
export function upcomingCount() {
  const today = new Date().toISOString().split('T')[0];
  const in7   = new Date(); in7.setDate(in7.getDate() + 7);
  const limit = in7.toISOString().split('T')[0];
  return A.events.filter(e =>
    e.date >= today && e.date <= limit &&
    e.status !== 'done' && e.status !== 'cancelled'
  ).length;
}

// ── Événements cette semaine (pour encart dashboard) ───────
export function thisWeekEvents() {
  const today = new Date(); today.setHours(0,0,0,0);
  const in7   = new Date(today); in7.setDate(in7.getDate() + 7);
  const t = today.toISOString().split('T')[0];
  const l = in7.toISOString().split('T')[0];
  return A.events
    .filter(e => e.date >= t && e.date <= l && e.status !== 'cancelled' && e.status !== 'done')
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Événements filtrés + triés ─────────────────────────────
export function filteredEvents() {
  let evs = [...A.events].sort((a, b) => a.date.localeCompare(b.date));
  if (A.calFilter && A.calFilter !== 'all') {
    evs = evs.filter(e => (e.shops || []).includes(A.calFilter));
  }
  return evs;
}

// ── Helpers boutique ───────────────────────────────────────
export function shopName(id)  { return (A.shops || []).find(s => s.id === id)?.name  || id; }
export function shopColor(id) { return (A.shops || []).find(s => s.id === id)?.color || '#888'; }

// ── Export PDF fiche événement ─────────────────────────────
export function exportEventPDF(id) {
  const ev = A.events.find(e => e.id === id);
  if (!ev) return;

  const st     = EVENT_STATUSES[ev.status] || EVENT_STATUSES.planned;
  const checks = (ev.checklist || []);

  const dateLabel = (() => {
    try {
      const d = new Date(ev.date);
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ev.date; }
  })();

  const shopsHtml = (ev.shops || []).map(sid =>
    `<span style="display:inline-block;padding:2px 8px;border-radius:12px;background:#E8F5EE;color:#1A7A4A;font-size:12px;font-weight:700;margin:2px">${shopName(sid)}</span>`
  ).join('');

  const checkHtml = checks.length ? `
    <div style="margin-top:20px">
      <h3 style="font-size:13px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">CHECKLIST</h3>
      ${checks.map(i => `
        <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #eee">
          <div style="width:16px;height:16px;border:2px solid ${i.done ? '#1A7A4A' : '#ccc'};border-radius:4px;background:${i.done ? '#1A7A4A' : '#fff'};flex-shrink:0;display:flex;align-items:center;justify-content:center">
            ${i.done ? '<span style="color:#fff;font-size:10px">✓</span>' : ''}
          </div>
          <span style="font-size:13px;color:${i.done ? '#999' : '#111'};text-decoration:${i.done ? 'line-through' : 'none'}">${i.label}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Événement — ${ev.title}</title></head>
  <body style="padding:32px;font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;border-bottom:3px solid #0D0D0D;padding-bottom:16px;margin-bottom:24px">
      <div>
        <h1 style="font-size:28px;font-weight:900;margin:0;letter-spacing:-1px">BOB<em style="color:#E8294B;font-style:normal">the</em>BAGEL</h1>
        <p style="color:#888;font-size:12px;margin:4px 0;letter-spacing:2px;text-transform:uppercase">FICHE ÉVÉNEMENT</p>
      </div>
      <div style="text-align:right">
        <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${st.bg};color:${st.color};font-size:12px;font-weight:700">${st.label}</span>
      </div>
    </div>

    <h2 style="font-size:22px;font-weight:900;margin:0 0 16px;letter-spacing:-0.5px">${ev.title}</h2>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:140px">Date</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;font-weight:600">${dateLabel}${ev.time ? ' · ' + ev.time : ''}</td>
      </tr>
      ${ev.location ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Lieu</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px">${ev.location}</td></tr>` : ''}
      ${ev.covers ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Couverts</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;font-weight:600">${ev.covers}</td></tr>` : ''}
      ${ev.shops?.length ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;vertical-align:top;padding-top:12px">Boutiques</td><td style="padding:8px 0;border-bottom:1px solid #eee">${shopsHtml}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Créé par</td><td style="padding:8px 0;font-size:12px;color:#888">${ev.createdBy}</td></tr>
    </table>

    ${ev.notes ? `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">NOTES LOGISTIQUES</h3>
        <div style="background:#F5F4F0;border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.6;color:#333">${ev.notes}</div>
      </div>
    ` : ''}

    ${checkHtml}

    <script>window.print();window.close();<\/script>
  </body></html>`);
  win.document.close();
}

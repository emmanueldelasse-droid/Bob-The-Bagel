/* ============================================================
   BOBtheBAGEL - js/modules/notifications.js
   Notifications ciblees par role (Manager / Team BTB / Kitchen)
   Persistance locale (clef 'nt'). A remplacer par Supabase en prod.
   ============================================================ */

import { A, sv } from '../state.js';
import { gId, nISO, render } from '../utils.js';
import {
  insertNotification,
  updateNotificationSeen,
  deleteNotificationApi,
  loadNotificationsIntoState,
} from '../api/supabase.js';

function persist() {
  sv('nt', A.notifications || []);
}

export { loadNotificationsIntoState };

export function ensureNotificationsState() {
  if (!Array.isArray(A.notifications)) {
    try {
      const raw = localStorage.getItem('nt');
      A.notifications = raw ? JSON.parse(raw) : [];
    } catch {
      A.notifications = [];
    }
  }
}

export function createNotification({ type, role = 'admin', title, body, shopId = null, orderId = null }) {
  ensureNotificationsState();
  const notif = {
    id: gId('N'),
    type,
    role,
    title: String(title || '').slice(0, 120),
    body: String(body || '').slice(0, 400),
    shopId,
    orderId,
    createdBy: A.cUser?.id || null,
    createdAt: nISO(),
    seenBy: {},
  };
  A.notifications = [notif, ...(A.notifications || [])].slice(0, 200);
  persist();
  // fire-and-forget Supabase insert
  insertNotification(notif).catch((error) => {
    console.warn('[BOB] insertNotification failed (kept local):', error);
  });
  return notif;
}

export function notificationsForRole(role) {
  ensureNotificationsState();
  return (A.notifications || []).filter((n) => !n.role || n.role === role);
}

export function unseenCountForUser(user) {
  if (!user) return 0;
  ensureNotificationsState();
  return notificationsForRole(user.role).filter((n) => !n.seenBy?.[user.id]).length;
}

export function markNotificationSeen(id, user) {
  if (!user) return;
  ensureNotificationsState();
  let seenBy = null;
  A.notifications = (A.notifications || []).map((n) => {
    if (n.id !== id) return n;
    seenBy = { ...(n.seenBy || {}), [user.id]: nISO() };
    return { ...n, seenBy };
  });
  persist();
  if (seenBy) {
    updateNotificationSeen(id, seenBy).catch((error) => {
      console.warn('[BOB] updateNotificationSeen failed:', error);
    });
  }
  render();
}

export function markAllSeen(user) {
  if (!user) return;
  ensureNotificationsState();
  const updates = [];
  A.notifications = (A.notifications || []).map((n) => {
    if (n.role && n.role !== user.role) return n;
    const seenBy = { ...(n.seenBy || {}), [user.id]: nISO() };
    updates.push({ id: n.id, seenBy });
    return { ...n, seenBy };
  });
  persist();
  updates.forEach(({ id, seenBy }) => {
    updateNotificationSeen(id, seenBy).catch((error) => {
      console.warn('[BOB] updateNotificationSeen failed:', error);
    });
  });
  render();
}

export function removeNotification(id) {
  ensureNotificationsState();
  A.notifications = (A.notifications || []).filter((n) => n.id !== id);
  persist();
  deleteNotificationApi(id).catch((error) => {
    console.warn('[BOB] deleteNotificationApi failed:', error);
  });
  render();
}

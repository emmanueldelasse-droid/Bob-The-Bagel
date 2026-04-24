/* ============================================================
   BOBtheBAGEL - js/auth.js
   Selection de profil (Supabase Auth sera branche a la fin des tests)
   ============================================================ */

import { A, INIT_USERS, ROLE_LABELS, sv, resetOrdersRuntime, resetStockRuntime, resetChatRuntime } from './state.js';
import { alog, toast, render, nISO } from './utils.js';
import {
  getSupabase,
  signOut,
  getCurrentProfile,
  loadOrdersIntoState,
  loadStockIntoState,
  loadShopsIntoState,
  loadPlanningIntoState,
  loadNotificationsIntoState,
  loadCalendarIntoState,
  loadProfilesIntoState,
  startRealtimeSync,
  stopRealtimeSync,
  startExtraRealtime,
  stopExtraRealtime,
} from './api/supabase.js';
import {
  loadChatIntoState,
  startChatRealtimeSync,
  stopChatRealtimeSync,
} from './modules/chat.js';
import { loadAuditsIntoState } from './modules/audit.js';

function buildTestUser(role) {
  const source = A.users.find((user) => user.role === role) || INIT_USERS.find((user) => user.role === role);
  const fallbackName = ROLE_LABELS[role] || 'User';

  return {
    id: source?.id || `test-${role}`,
    name: source?.name || fallbackName,
    role,
    photo: source?.photo || null,
    email: `${role}@test.local`,
  };
}

function hydrateUser(profile) {
  A.cUser = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    photo: profile.photo_url || null,
    email: profile.email,
  };
}

function logConnection(label) {
  A.cLog = [{ user: label, time: nISO() }, ...A.cLog].slice(0, 100);
  sv('cl', A.cLog);
}

function openDefaultView(_role) {
  A.selShop = null;
  A.view = 'select';
}

async function startAuthenticatedApp() {
  await loadShopsIntoState();
  await loadProfilesIntoState();
  await loadOrdersIntoState();
  await loadStockIntoState();
  await loadChatIntoState();
  await loadAuditsIntoState();
  await loadPlanningIntoState();
  await loadNotificationsIntoState();
  await loadCalendarIntoState();
  await startRealtimeSync();
  await startChatRealtimeSync();
  await startExtraRealtime({
    planning: async () => { await loadPlanningIntoState(); render(); },
    notifications: async () => { await loadNotificationsIntoState(); render(); },
    events: async () => { await loadCalendarIntoState(); render(); },
    audits: async () => { await loadAuditsIntoState(); render(); },
  });
}

async function clearRemoteSession() {
  try {
    await stopChatRealtimeSync();
    await stopRealtimeSync();
    await stopExtraRealtime();
    await signOut();
  } catch (error) {
    console.warn('[BOB] clearRemoteSession:', error);
  }
}

function resetTransientState() {
  A.cart = {};
  A.note = '';
  A.search = '';
  A.orders = [];
  A.messages = [];
  A.conversations = [];
  resetOrdersRuntime();
  resetStockRuntime();
  resetChatRuntime();
}

async function enterProfile(role) {
  const safeRole = role === 'admin' ? 'admin' : 'user';
  const user = buildTestUser(safeRole);

  A.testProfile = safeRole;
  sv('tp', safeRole);
  A.lAttempts = 0;
  A.lLocked = false;
  A.cUser = user;
  resetTransientState();
  logConnection(user.name);
  alog(`Acces: ${user.name}`);
  openDefaultView(safeRole);
  await startAuthenticatedApp();
  render();
}

export async function dLog(role = 'user') {
  await clearRemoteSession();
  await enterProfile(role);
}

export async function logout() {
  await clearRemoteSession();

  A.cUser = null;
  A.testProfile = null;
  sv('tp', null);
  A.view = 'login';
  resetTransientState();
  render();
}

export async function restoreSession() {
  try {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data?.session) {
        const profile = await getCurrentProfile();
        if (profile) {
          A.testProfile = null;
          sv('tp', null);
          hydrateUser(profile);
          await startAuthenticatedApp();
          A.view = A.view === 'login' ? 'select' : A.view;
          return true;
        }
      }
    }

    if (A.testProfile) {
      A.cUser = buildTestUser(A.testProfile);
      A.selShop = null;
      A.view = 'select';
      await startAuthenticatedApp();
      return true;
    }

    return false;
  } catch (e) {
    console.warn('[BOB] restoreSession error:', e);
    return false;
  }
}

export function isAdmin()   { return A.cUser?.role === 'admin'; }
export function isKitchen() { return A.cUser?.role === 'kitchen'; }
export function isUser()    { return A.cUser?.role === 'user'; }

export function canAccessShop(_shopId) {
  if (!A.cUser) return false;
  if (isAdmin()) return true;
  if (isKitchen()) return true;
  return true;
}

export function canAccessKitchen() {
  if (!A.cUser) return false;
  return isAdmin() || isKitchen();
}

export function changePassword(_userId, _newPassword) {
  toast('Changement de mot de passe - a brancher etape 4.7', 'error');
}

export function createUserCredential(_userId, _password) {
  // no-op
}

export function deleteUserCredential(_userId) {
  // no-op
}

/* ============================================================
   BOBtheBAGEL - js/auth.js
   Acces test direct + session Supabase existante
   ============================================================ */

import { A, INIT_USERS, sv, resetOrdersRuntime, resetStockRuntime, resetChatRuntime } from './state.js';
import { alog, toast, render, nISO } from './utils.js';
import {
  getSupabase,
  signOut,
  getCurrentProfile,
  loadOrdersIntoState,
  loadStockIntoState,
  startRealtimeSync,
  stopRealtimeSync,
} from './api/supabase.js';
import {
  loadChatIntoState,
  startChatRealtimeSync,
  stopChatRealtimeSync,
} from './modules/chat.js';

function buildTestUser(role) {
  const source = A.users.find((user) => user.role === role) || INIT_USERS.find((user) => user.role === role);
  const fallbackName = role === 'admin' ? 'Admin' : 'User';

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

function openDefaultView(role) {
  A.selShop = null;
  if (role === 'admin') {
    A.admTab = 'banner';
    A.view = 'admin';
    return;
  }
  A.view = 'select';
}

async function startAuthenticatedApp() {
  await loadOrdersIntoState();
  await loadStockIntoState();
  await loadChatIntoState();
  await startRealtimeSync();
  await startChatRealtimeSync();
}

async function clearRemoteSession() {
  try {
    await stopChatRealtimeSync();
    await stopRealtimeSync();
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

function enterTestProfile(role) {
  const safeRole = role === 'admin' ? 'admin' : 'user';
  const user = buildTestUser(safeRole);

  A.testProfile = safeRole;
  sv('tp', safeRole);
  A.lAttempts = 0;
  A.lLocked = false;
  A.cUser = user;
  resetTransientState();
  logConnection(`${user.name} (test)`);
  alog(`Acces test: ${user.name}`);
  openDefaultView(safeRole);
  render();
}

export async function dLog(role = 'user') {
  await clearRemoteSession();
  enterTestProfile(role);
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
      openDefaultView(A.testProfile);
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

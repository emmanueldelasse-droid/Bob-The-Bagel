/* ============================================================
   BOBtheBAGEL - js/auth.js
   Acces test direct + session Supabase existante
   ============================================================ */

import { A, INIT_USERS, sv, resetOrdersRuntime, resetStockRuntime, resetChatRuntime } from './state.js';
import { alog, toast, render, nISO } from './utils.js';
import {
  getSupabase,
  signIn,
  signOut,
  getCurrentProfile,
  loadOrdersIntoState,
  loadStockIntoState,
  loadShopsIntoState,
  resolveLoginIdentifier,
  startRealtimeSync,
  stopRealtimeSync,
} from './api/supabase.js';
import {
  loadChatIntoState,
  startChatRealtimeSync,
  stopChatRealtimeSync,
} from './modules/chat.js';
import { loadAuditsIntoState } from './modules/audit.js';

function buildTestUser(role) {
  const source = A.users.find((user) => user.role === role) || INIT_USERS.find((user) => user.role === role);
  const fallbackName = role === 'admin' ? 'Manager'
                     : role === 'boss'  ? 'Boss'
                     :                    'Team BTB';

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
  if (role === 'boss')        A.view = 'boss';
  else if (role === 'admin')  A.view = 'admin';
  else if (role === 'kitchen') A.view = 'kitchen';
  else                         A.view = 'select';
}

async function startAuthenticatedApp() {
  await loadShopsIntoState();
  await loadOrdersIntoState();
  await loadStockIntoState();
  await loadChatIntoState();
  await loadAuditsIntoState();
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

async function enterTestProfile(role) {
  const allowed = ['admin', 'user', 'boss', 'kitchen'];
  const safeRole = allowed.includes(role) ? role : 'user';
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
  await startAuthenticatedApp();
  render();
}

export async function dLog(role = 'user') {
  await clearRemoteSession();
  await enterTestProfile(role);
}

// Connexion via Supabase Auth (email + mot de passe). Lit ensuite le profil
// applicatif pour récupérer le rôle, hydrate A.cUser et route automatiquement
// vers la vue par défaut du rôle.
export function setLoginField(key, value) {
  if (key === 'loginEmail' || key === 'loginPassword') {
    A[key] = value;
  }
}

export async function loginEmail() {
  const identifier = (A.loginEmail || '').trim();
  const password = A.loginPassword || '';
  A.loginError = '';

  if (!identifier || !password) {
    A.loginError = 'Pseudo (ou email) et mot de passe requis.';
    render();
    return;
  }

  A.loginLoading = true;
  render();

  try {
    A.testProfile = null;
    sv('tp', null);

    // Résout pseudo → email si l'identifiant ne contient pas d'@
    const email = await resolveLoginIdentifier(identifier);
    if (!email) {
      throw new Error('Pseudo introuvable.');
    }

    await signIn(email, password);
    const profile = await getCurrentProfile();
    if (!profile) throw new Error("Profil introuvable. Demande à l'admin de créer ton compte.");
    if (!profile.role) throw new Error("Profil sans rôle. Demande à l'admin de te configurer un rôle.");

    hydrateUser(profile);
    A.lAttempts = 0;
    A.lLocked = false;
    resetTransientState();
    logConnection(profile.name || identifier);
    alog(`Connexion: ${profile.name || identifier}`);
    openDefaultView(profile.role);
    await startAuthenticatedApp();

    A.loginEmail = '';
    A.loginPassword = '';
  } catch (e) {
    const raw = e?.message || 'Connexion impossible';
    A.loginError = /invalid|credentials/i.test(raw)
      ? 'Identifiant ou mot de passe incorrect.'
      : raw;
    console.warn('[BOB] loginEmail:', e);
  } finally {
    A.loginLoading = false;
    A.loginPassword = '';
    render();
  }
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
      await startAuthenticatedApp();
      return true;
    }

    return false;
  } catch (e) {
    console.warn('[BOB] restoreSession error:', e);
    return false;
  }
}

// Le rôle admin couvre Manager, le rôle boss couvre Manager + cockpit Boss.
// isAdmin() retourne true pour les deux car Boss = superset complet du Manager.
export function isAdmin()   { return A.cUser?.role === 'admin' || A.cUser?.role === 'boss'; }
export function isBoss()    { return A.cUser?.role === 'boss'; }
export function isManager() { return A.cUser?.role === 'admin'; }
export function isKitchen() { return A.cUser?.role === 'kitchen'; }
export function isUser()    { return A.cUser?.role === 'user'; }

export function canAccessShop(_shopId) {
  if (!A.cUser) return false;
  return true;
}

// Cuisine centrale ouverte à tous les utilisateurs connectés (Team BTB, Manager,
// Boss, Kitchen) — décision validée : la cuisine est un espace au même titre
// qu'une boutique.
export function canAccessKitchen() {
  return !!A.cUser;
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

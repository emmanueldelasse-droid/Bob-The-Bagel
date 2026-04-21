/* ============================================================
   BOBtheBAGEL - js/auth.js
   Authentification Supabase · Session · Droits
   ============================================================ */

import { A, resetOrdersRuntime, resetStockRuntime, resetChatRuntime } from './state.js';
import { toast, render } from './utils.js';
import {
  getSupabase,
  requestMagicLink,
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

function showLoginMessage(text, type = 'error') {
  const el = document.getElementById('le');
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  el.style.color = type === 'success' ? 'var(--green)' : 'var(--red)';
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

async function startAuthenticatedApp() {
  await loadOrdersIntoState();
  await loadStockIntoState();
  await loadChatIntoState();
  await startRealtimeSync();
  await startChatRealtimeSync();
}

export async function dLog() {
  if (A.lLocked) return;

  const email = document.getElementById('ln')?.value?.trim() || '';

  if (!email) {
    showLoginMessage('Email requis');
    return;
  }

  try {
    await requestMagicLink(email);
    A.lAttempts = 0;
    showLoginMessage('Lien de connexion envoyé. Ouvre ton email puis reviens ici.', 'success');
    toast('Lien de connexion envoyé', 'success');
  } catch (err) {
    A.lAttempts++;
    const msg = err?.message?.toLowerCase() || '';

    if (msg.includes('network') || msg.includes('fetch')) {
      showLoginMessage('Erreur reseau - verifier la connexion');
    } else if (msg.includes('email') && (msg.includes('not') || msg.includes('unknown'))) {
      showLoginMessage('Email inconnu ou non autorise');
    } else if (msg.includes('otp') || msg.includes('magic') || msg.includes('disabled')) {
      showLoginMessage('Connexion email non disponible pour le moment');
    } else {
      showLoginMessage('Envoi du lien impossible');
    }

    if (A.lAttempts >= 5) {
      A.lLocked = true;
      toast('Compte bloque 30 secondes', 'error');
      setTimeout(() => {
        A.lLocked = false;
        A.lAttempts = 0;
        render();
      }, 30000);
    }

    console.warn('[BOB] magic link error:', err);
  }
}

export async function logout() {
  try {
    await stopChatRealtimeSync();
    await stopRealtimeSync();
    await signOut();
  } catch (e) {
    console.warn('[BOB] signOut error:', e);
  }

  A.cUser = null;
  A.selShop = null;
  A.view = 'login';
  A.cart = {};
  A.note = '';
  A.search = '';
  A.orders = [];
  A.messages = [];
  A.conversations = [];
  resetOrdersRuntime();
  resetStockRuntime();
  resetChatRuntime();
  render();
}

export async function restoreSession() {
  try {
    const sb = getSupabase();
    if (!sb) return false;

    const { data } = await sb.auth.getSession();
    if (!data?.session) return false;

    const profile = await getCurrentProfile();
    if (!profile) return false;

    hydrateUser(profile);
    await startAuthenticatedApp();

    A.view = A.view === 'login' ? 'select' : A.view;
    return true;
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

/* ============================================================
   BOBtheBAGEL — js/auth.js v2
   Authentification Supabase · Session · Droits
   ============================================================ */

import { A, sv }                   from './state.js';
import { alog, toast, render, nISO } from './utils.js';
import { getSupabase, signIn, signOut, getCurrentProfile } from './api/supabase.js';

// ── Login (Supabase Auth) ─────────────────────────────────
export async function dLog() {
  if (A.lLocked) return;

  const email = document.getElementById('ln')?.value?.trim() || '';
  const pass  = document.getElementById('lp')?.value || '';

  if (!email || !pass) {
    const el = document.getElementById('le');
    if (el) {
      el.textContent     = 'Email et mot de passe requis';
      el.style.display   = 'block';
    }
    return;
  }

  try {
    // 1. Authentification via Supabase
    await signIn(email, pass);

    // 2. Récupération du profil (nom + rôle)
    const profile = await getCurrentProfile();
    if (!profile) {
      toast('Profil introuvable — contacter un admin', 'error');
      await signOut();
      return;
    }

    // 3. Injection dans l'état global (forme compatible avec l'existant)
    A.cUser = {
      id:    profile.id,
      name:  profile.name,
      role:  profile.role,
      photo: profile.photo_url || null,
      email: profile.email,
    };
    A.lAttempts = 0;

    // Log de connexion
    A.cLog = [{ user: profile.name, time: nISO() }, ...A.cLog].slice(0, 100);
    sv('cl', A.cLog);
    alog(`Connexion: ${profile.name}`);

    A.view = 'select';
    render();
  } catch (err) {
    A.lAttempts++;
    const el = document.getElementById('le');
    if (el) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('invalid')) {
        el.textContent = 'Email ou mot de passe incorrect';
      } else if (msg.includes('network') || msg.includes('fetch')) {
        el.textContent = 'Erreur réseau — vérifier la connexion';
      } else {
        el.textContent = 'Connexion impossible';
      }
      el.style.display = 'block';
    }

    if (A.lAttempts >= 5) {
      A.lLocked = true;
      toast('Compte bloqué 30 secondes', 'error');
      setTimeout(() => {
        A.lLocked   = false;
        A.lAttempts = 0;
        render();
      }, 30000);
    }

    console.warn('[BOB] signIn error:', err);
  }
}

// ── Logout ─────────────────────────────────────────────────
export async function logout() {
  try {
    await signOut();
  } catch (e) {
    console.warn('[BOB] signOut error:', e);
  }
  A.cUser   = null;
  A.selShop = null;
  A.view    = 'login';
  A.cart    = {};
  A.note    = '';
  A.search  = '';
  render();
}

// ── Restauration de session au démarrage ──────────────────
/**
 * Appelée au boot de l'app : vérifie si une session Supabase
 * est déjà active (onglet rafraîchi, retour sur l'onglet...).
 * Si oui, remplit A.cUser pour court-circuiter l'écran login.
 */
export async function restoreSession() {
  try {
    const sb = getSupabase();
    if (!sb) return false;

    const { data } = await sb.auth.getSession();
    if (!data?.session) return false;

    const profile = await getCurrentProfile();
    if (!profile) return false;

    A.cUser = {
      id:    profile.id,
      name:  profile.name,
      role:  profile.role,
      photo: profile.photo_url || null,
      email: profile.email,
    };
    A.view = A.view === 'login' ? 'select' : A.view;
    return true;
  } catch (e) {
    console.warn('[BOB] restoreSession error:', e);
    return false;
  }
}

// ── Droits ─────────────────────────────────────────────────
export function isAdmin()   { return A.cUser?.role === 'admin'; }
export function isKitchen() { return A.cUser?.role === 'kitchen'; }
export function isUser()    { return A.cUser?.role === 'user'; }

/**
 * Vérifie si l'utilisateur courant a accès à une boutique donnée.
 * À l'étape 4.3, on vérifiera via user_shop_access en base.
 */
export function canAccessShop(_shopId) {
  if (!A.cUser) return false;
  if (isAdmin()) return true;
  if (isKitchen()) return true;
  // TODO étape 4.3 : vérifier user_shop_access
  return true;
}

export function canAccessKitchen() {
  if (!A.cUser) return false;
  return isAdmin() || isKitchen();
}

// ── Stubs pour compatibilité (seront retirés étape 4.7) ───
// Ces fonctions sont encore appelées par modules/admin.js.
// On les garde en "no-op" pour ne rien casser tant qu'on n'a
// pas branché la gestion des users à Supabase.
export function changePassword(_userId, _newPassword) {
  toast('Changement de mot de passe — à brancher étape 4.7', 'error');
}

export function createUserCredential(_userId, _password) {
  // no-op : la création de compte se fait côté Supabase Auth
}

export function deleteUserCredential(_userId) {
  // no-op
}

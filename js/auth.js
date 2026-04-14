/* ============================================================
   BOBtheBAGEL — js/auth.js
   Login · Logout · Session · Droits
   ============================================================ */

import { A, sv, INIT_CREDENTIALS } from './state.js';
import { alog, toast, render, nISO } from './utils.js';

// ── Credentials (prototype uniquement) ────────────────────
// ⚠️ DETTE SÉCURITÉ : En production, remplacer par Supabase Auth.
// Les mots de passe ne doivent JAMAIS être dans le JS front.
// Séparés de A.users pour ne pas les exposer dans l'UI.
let _credentials = (() => {
  try {
    const stored = localStorage.getItem('_creds');
    return stored ? JSON.parse(stored) : INIT_CREDENTIALS;
  } catch { return INIT_CREDENTIALS; }
})();

function saveCredentials() {
  try { localStorage.setItem('_creds', JSON.stringify(_credentials)); }
  catch { /* silently fail */ }
}

// ── Login ──────────────────────────────────────────────────
export function dLog() {
  if (A.lLocked) return;

  const name = document.getElementById('ln')?.value?.trim() || '';
  const pass = document.getElementById('lp')?.value || '';

  // Cherche l'utilisateur par nom (insensible à la casse)
  const user = A.users.find(u => u.name.toLowerCase() === name.toLowerCase());

  // Vérifie le mot de passe séparément (jamais dans A.users)
  const cred = user && _credentials.find(c => c.id === user.id && c.password === pass);

  if (!user || !cred) {
    A.lAttempts++;
    const el = document.getElementById('le');
    if (el) el.style.display = 'block';

    if (A.lAttempts >= 5) {
      A.lLocked = true;
      toast('Compte bloqué 30 secondes', 'error');
      setTimeout(() => {
        A.lLocked = false;
        A.lAttempts = 0;
        render();
      }, 30000);
    }
    return;
  }

  // Connexion réussie
  A.cUser     = user;
  A.lAttempts = 0;

  // Log de connexion
  A.cLog = [{ user: user.name, time: nISO() }, ...A.cLog].slice(0, 100);
  sv('cl', A.cLog);
  alog(`Connexion: ${user.name}`);

  A.view = 'select';
  render();
}

// ── Logout ─────────────────────────────────────────────────
export function logout() {
  A.cUser   = null;
  A.selShop = null;
  A.view    = 'login';
  A.cart    = {};
  A.note    = '';
  A.search  = '';
  render();
}

// ── Droits ─────────────────────────────────────────────────
export function isAdmin()   { return A.cUser?.role === 'admin'; }
export function isKitchen() { return A.cUser?.role === 'kitchen'; }
export function isUser()    { return A.cUser?.role === 'user'; }

/**
 * Vérifie si l'utilisateur courant a accès à une boutique donnée.
 * En production, vérifier via user_shop_access en base.
 */
export function canAccessShop(shopId) {
  if (!A.cUser) return false;
  if (isAdmin()) return true;
  // TODO : implémenter les accès granulaires en production
  return true;
}

export function canAccessKitchen() {
  if (!A.cUser) return false;
  return isAdmin() || isKitchen();
}

// ── Changement de mot de passe (profil) ───────────────────
export function changePassword(userId, newPassword) {
  if (!newPassword?.trim()) return;
  _credentials = _credentials.map(c =>
    c.id === userId ? { ...c, password: newPassword } : c
  );
  saveCredentials();
}

// ── Création utilisateur ───────────────────────────────────
export function createUserCredential(userId, password) {
  _credentials = [..._credentials, { id: userId, password }];
  saveCredentials();
}

export function deleteUserCredential(userId) {
  _credentials = _credentials.filter(c => c.id !== userId);
  saveCredentials();
}

/* ============================================================
   BOBtheBAGEL — js/modules/admin.js
   Gestion utilisateurs · Produits · Bannière · Logs
   ============================================================ */

import { A, sv }                              from '../state.js';
import { gId, nISO, cap, toast, render, alog } from '../utils.js';
import { createUserCredential, deleteUserCredential, changePassword } from '../auth.js';
import { enterAdminAuditContext } from './audit.js';
import { enterAdminPlanningContext } from './planning.js';

// ── Tabs admin ─────────────────────────────────────────────
export function sAT(tab) {
  A.admTab = tab;
  if (tab === 'audit') enterAdminAuditContext();
  if (tab === 'planning') enterAdminPlanningContext();
  render();
}

// ── Bannière ───────────────────────────────────────────────
export function sBn(v)  { A.banner = v; }

export function svBn() {
  sv('bn', A.banner);
  toast('Bannière publiée ✓');
  render(); // pour mettre à jour updateBanner()
}

export function clBn() {
  A.banner = '';
  sv('bn', '');
  render();
}

// ── Utilisateurs ───────────────────────────────────────────
export function tAU() {
  A.addU = !A.addU;
  A.nU   = { name: '', password: '', role: 'user' };
  render();
}

export function sNU(field, val) { A.nU[field] = val; }

export function aU() {
  const f = A.nU;
  if (!f.name?.trim())     { toast('Nom requis', 'error'); return; }
  if (!f.password?.trim()) { toast('Mot de passe requis', 'error'); return; }

  const exists = A.users.some(u => u.name.toLowerCase() === f.name.toLowerCase());
  if (exists) { toast('Nom déjà utilisé', 'error'); return; }

  const id = 'u-' + gId();
  const newUser = { id, name: cap(f.name), role: f.role, photo: null };

  A.users = [...A.users, newUser];
  sv('us', A.users);

  // Credential stocké séparément (sécurité prototype)
  createUserCredential(id, cap(f.password));

  A.addU = false;
  alog(`Utilisateur créé: ${newUser.name}`);
  toast('Utilisateur créé ✓');
  render();
}

export function dU(id) {
  if (id === A.cUser?.id) { toast('Impossible de supprimer son propre compte', 'error'); return; }

  A.confirm = {
    msg: 'Supprimer cet utilisateur ?',
    fn: () => {
      A.users = A.users.filter(u => u.id !== id);
      sv('us', A.users);
      deleteUserCredential(id);
      alog(`Utilisateur supprimé: ${id}`);
      toast('Supprimé', 'error');
      render();
    },
  };
  render();
}

// ── Produits ───────────────────────────────────────────────
export function tAP() {
  A.addP = !A.addP;
  A.nP   = { name: '', cat: 'PAINS', unit: 'pcs', step: 1, price: 0 };
  render();
}

export function sNP(field, val) { A.nP[field] = val; }

export function aP2() {
  const f = A.nP;
  if (!f.name?.trim()) { toast('Nom requis', 'error'); return; }

  const exists = A.products.some(p => p.name.toLowerCase() === f.name.toLowerCase());
  if (exists) { toast('Produit déjà existant', 'error'); return; }

  const newProd = {
    id:     'c-' + Date.now(),
    ...f,
    name:   f.name.toUpperCase(),
    active: true,
  };

  A.products = [...A.products, newProd];
  sv('pr', A.products);
  A.addP = false;
  alog(`Produit ajouté: ${newProd.name}`);
  toast('Produit ajouté ✓');
  render();
}

export function tP(id) {
  A.products = A.products.map(p => p.id === id ? { ...p, active: !p.active } : p);
  sv('pr', A.products);
  render();
}

// ── Profil utilisateur ─────────────────────────────────────
export function trPh() { document.getElementById('phi')?.click(); }

export function hdPh(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Vérifie la taille (max 500 Ko pour localStorage)
  if (file.size > 512 * 1024) {
    toast('Image trop lourde (max 500 Ko)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    const photo = ev.target.result;
    A.cUser = { ...A.cUser, photo };
    A.users = A.users.map(u => u.id === A.cUser.id ? { ...u, photo } : u);
    sv('us', A.users);
    render();
  };
  reader.readAsDataURL(file);
}

export function svPr() {
  const name    = document.getElementById('pn')?.value?.trim() || A.cUser.name;
  const newPass = document.getElementById('pp')?.value || '';

  if (newPass) changePassword(A.cUser.id, newPass);

  A.cUser = { ...A.cUser, name };
  A.users = A.users.map(u => u.id === A.cUser.id ? A.cUser : u);
  sv('us', A.users);
  alog('Profil mis à jour');
  toast('Profil sauvegardé ✓');
  render();
}

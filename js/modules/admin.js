/* ============================================================
   BOBtheBAGEL — js/modules/admin.js
   Gestion utilisateurs · Produits · Bannière · Logs
   ============================================================ */

import { A, sv }                              from '../state.js';
import { gId, nISO, cap, toast, render, alog } from '../utils.js';
import { createUserCredential, deleteUserCredential, changePassword } from '../auth.js';
import { enterAdminAuditContext } from './audit.js';
import { enterAdminPlanningContext } from './planning.js';
import { upsertProfile, deleteProfile, upsertShop, deleteShop as deleteShopApi } from '../api/supabase.js';

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

export async function aU() {
  const f = A.nU;
  if (!f.name?.trim())     { toast('Nom requis', 'error'); return; }
  if (!f.password?.trim()) { toast('Mot de passe requis', 'error'); return; }

  const exists = A.users.some(u => u.name.toLowerCase() === f.name.toLowerCase());
  if (exists) { toast('Nom déjà utilisé', 'error'); return; }

  const id = 'u-' + gId();
  const newUser = { id, name: cap(f.name), role: f.role, photo: null, shopIds: f.shopIds || [] };

  A.users = [...A.users, newUser];
  sv('us', A.users);

  try {
    await upsertProfile(newUser);
  } catch (error) {
    console.warn('[BOB] upsertProfile failed (kept local):', error);
  }
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
    fn: async () => {
      A.users = A.users.filter(u => u.id !== id);
      sv('us', A.users);
      deleteUserCredential(id);
      try {
        await deleteProfile(id);
      } catch (error) {
        console.warn('[BOB] deleteProfile failed:', error);
      }
      alog(`Utilisateur supprimé: ${id}`);
      toast('Supprimé', 'error');
      render();
    },
  };
  render();
}

// ── Boutiques (Manager CRUD) ───────────────────────────────
const SHOP_COLORS = ['#0E4B30', '#E8B84B', '#E87B4B', '#4B8BE8', '#9B59B6', '#16A085', '#E74C3C'];

export function tAShop() {
  A.addShop = !A.addShop;
  A.nShop = { id: '', name: '', color: SHOP_COLORS[0] };
  render();
}

export function sNShop(field, val) { A.nShop[field] = val; }

function slugify(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/œ/g, 'oe')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || `sh-${Date.now().toString(36)}`;
}

export async function aShop() {
  const f = A.nShop || {};
  if (!f.name?.trim()) { toast('Nom requis', 'error'); return; }
  const slug = (f.id?.trim() || slugify(f.name));
  if ((A.shops || []).some((s) => (s.slug || s.id) === slug)) { toast('Slug déjà utilisé', 'error'); return; }

  const optimisticId = `local-${slug}`;
  const optimistic = { id: optimisticId, slug, name: f.name.trim(), color: f.color || SHOP_COLORS[0], isActive: true };
  A.shops = [...(A.shops || []), optimistic];
  sv('sh', A.shops);

  try {
    const saved = await upsertShop({ slug, name: optimistic.name, color: optimistic.color, isActive: true });
    if (saved) {
      A.shops = A.shops.map((s) => (s.id === optimisticId ? saved : s));
      sv('sh', A.shops);
    }
  } catch (error) {
    console.warn('[BOB] upsertShop failed (kept local):', error);
  }
  A.addShop = false;
  alog(`Boutique créée: ${optimistic.name}`);
  toast('Boutique ajoutée ✓');
  render();
}

export function dShop(id) {
  if (A.selShop?.id === id) { toast('Quitter la boutique d\'abord', 'warn'); return; }
  A.confirm = {
    msg: 'Supprimer cette boutique ?',
    fn: async () => {
      A.shops = (A.shops || []).filter((s) => s.id !== id);
      sv('sh', A.shops);
      try {
        await deleteShopApi(id);
      } catch (error) {
        console.warn('[BOB] deleteShop failed:', error);
      }
      alog(`Boutique supprimée: ${id}`);
      toast('Supprimée', 'error');
      render();
    },
  };
  render();
}

export async function setShopColor(id, color) {
  const target = (A.shops || []).find((s) => s.id === id);
  if (!target) return;
  A.shops = A.shops.map((s) => (s.id === id ? { ...s, color } : s));
  sv('sh', A.shops);
  try {
    const shop = A.shops.find((s) => s.id === id);
    if (shop) await upsertShop(shop);
  } catch (error) {
    console.warn('[BOB] setShopColor failed:', error);
  }
  render();
}

export async function toggleUserShop(userId, shopId) {
  A.users = A.users.map((u) => {
    if (u.id !== userId) return u;
    const ids = new Set(u.shopIds || []);
    if (ids.has(shopId)) ids.delete(shopId); else ids.add(shopId);
    return { ...u, shopIds: Array.from(ids) };
  });
  sv('us', A.users);
  const user = A.users.find((u) => u.id === userId);
  if (user) {
    try {
      await upsertProfile(user);
    } catch (error) {
      console.warn('[BOB] toggleUserShop failed:', error);
    }
  }
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

/* ============================================================
   BOBtheBAGEL — js/views/admin.js
   Vue administration : users, produits, bannière, logs
   ============================================================ */

import { A }    from '../state.js';
import { aP, oCats, fD, fT, cSec } from '../utils.js';

export function bAdmin() {
  const tabs = [
    { id: 'banner',  label: '🚨 Bannière' },
    { id: 'users',   label: '👥 Utilisateurs' },
    { id: 'prods',   label: '🛍️ Produits' },
    { id: 'actlog',  label: '📋 Actions' },
    { id: 'connlog', label: '🔐 Connexions' },
  ];

  let content = '';
  switch (A.admTab) {
    case 'banner':  content = bBanner();  break;
    case 'users':   content = bUsers();   break;
    case 'prods':   content = bProds();   break;
    case 'actlog':  content = bActLog();  break;
    case 'connlog': content = bConnLog(); break;
    default:        content = bBanner();
  }

  return `
    <div class="page">
      <!-- Header admin -->
      <div class="hdr">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="bgh" style="font-size:12px;padding:6px 10px" onclick="window.__BOB__.goSel()">← Retour</button>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:2px;color:var(--rd)">
            ADMINISTRATION
          </span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="bgh" style="font-size:11px;padding:5px 10px" onclick="window.__BOB__.toggleDark()">${A.dark ? '☀️' : '🌙'}</button>
          <button class="bgh" style="font-size:11px;padding:5px 10px" onclick="window.__BOB__.logout()">↩</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tbr">
        ${tabs.map(t => `
          <button class="tb${A.admTab === t.id ? ' on' : ''}" onclick="window.__BOB__.sAT('${t.id}')" style="font-size:11px">
            ${t.label}
          </button>
        `).join('')}
      </div>

      <div class="main-content">${content}</div>
    </div>`;
}

// ── Bannière ───────────────────────────────────────────────
function bBanner() {
  return `
    <div style="padding:16px">
      <div class="slbl" style="padding:0 0 10px">BANNIÈRE D'ANNONCE GLOBALE</div>
      <p style="font-size:12px;color:var(--mt);margin-bottom:12px">
        Ce message sera affiché en haut de l'écran pour tous les utilisateurs.
      </p>
      <textarea
        class="taf"
        rows="3"
        placeholder="Ex: Fermeture le 25 mars · Livraison décalée..."
        oninput="window.__BOB__.sBn(this.value)"
      >${A.banner || ''}</textarea>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="bgn" style="flex:1;min-height:44px" onclick="window.__BOB__.svBn()">Publier</button>
        <button class="bsm" style="min-height:44px" onclick="window.__BOB__.clBn()">Effacer</button>
      </div>
    </div>`;
}

// ── Utilisateurs ───────────────────────────────────────────
function bUsers() {
  return `
    <div>
      <div style="padding:13px 14px;border-bottom:2px solid var(--br);display:flex;justify-content:space-between;align-items:center;background:var(--bg2)">
        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;letter-spacing:2px;color:var(--gn)">UTILISATEURS</span>
        <button class="bsm" style="background:var(--bk);color:#fff;border:none;min-height:42px" onclick="window.__BOB__.tAU()">+ Utilisateur</button>
      </div>

      ${A.addU ? `
        <div style="padding:14px;background:var(--gy);border-bottom:1px solid var(--br);display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <input
            placeholder="Nom"
            oninput="window.__BOB__.sNU('name',this.value)"
            style="border:1.5px solid var(--br);padding:9px 11px;border-radius:8px;font-size:14px;background:var(--bg2);color:var(--bk);outline:none;width:130px;min-height:42px"
          />
          <input
            placeholder="Mot de passe"
            oninput="window.__BOB__.sNU('password',this.value)"
            style="border:1.5px solid var(--br);padding:9px 11px;border-radius:8px;font-size:14px;background:var(--bg2);color:var(--bk);outline:none;width:130px;min-height:42px"
          />
          <select
            onchange="window.__BOB__.sNU('role',this.value)"
            style="border:1.5px solid var(--br);padding:9px;border-radius:8px;font-size:14px;background:var(--bg2);color:var(--bk);min-height:42px;outline:none"
          >
            <option value="user">Boutique</option>
            <option value="kitchen">Cuisine</option>
            <option value="admin">Admin</option>
          </select>
          <button class="bsm" style="background:var(--gn);color:#fff;border:none;min-height:42px" onclick="window.__BOB__.aU()">OK</button>
          <button class="bsm" style="min-height:42px" onclick="window.__BOB__.tAU()">Annuler</button>
        </div>
      ` : ''}

      ${A.users.map(u => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;border-bottom:1px solid var(--br);background:var(--bg2)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:50%;background:var(--gn);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;overflow:hidden;flex-shrink:0">
              ${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : u.name[0]}
            </div>
            <div>
              <div style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;color:var(--bk)">${u.name}</div>
              <div style="font-size:11px;color:var(--mt);margin-top:2px">
                <span style="font-weight:700;color:${u.role === 'admin' ? 'var(--rd)' : u.role === 'kitchen' ? 'var(--yl)' : 'var(--bl)'}">
                  ${u.role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onclick="window.__BOB__.dU('${u.id}')"
            style="font-size:12px;font-weight:700;padding:6px 12px;border:none;cursor:pointer;background:#FEE2E2;color:var(--rd);border-radius:8px;min-height:36px"
          >✕</button>
        </div>
      `).join('')}
    </div>`;
}

// ── Produits ───────────────────────────────────────────────
function bProds() {
  const cs = oCats();

  return `
    <div>
      <div style="padding:13px 14px;border-bottom:2px solid var(--br);display:flex;justify-content:space-between;align-items:center;background:var(--bg2)">
        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;letter-spacing:2px;color:var(--gn)">GESTION DES PRODUITS</span>
        <button class="bsm" style="background:var(--gn);color:#fff;border:none;min-height:42px" onclick="window.__BOB__.tAP()">+ Ajouter</button>
      </div>

      ${A.addP ? `
        <div style="padding:14px;background:var(--gy);border-bottom:1px solid var(--br);display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <input
            placeholder="Nom du produit"
            oninput="window.__BOB__.sNP('name',this.value)"
            style="border:1.5px solid var(--br);padding:9px 11px;border-radius:8px;font-size:14px;background:var(--bg2);color:var(--bk);outline:none;width:160px;min-height:42px"
          />
          <select
            onchange="window.__BOB__.sNP('cat',this.value)"
            style="border:1.5px solid var(--br);padding:9px;border-radius:8px;font-size:14px;background:var(--bg2);color:var(--bk);min-height:42px;outline:none"
          >
            ${cs.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <select
            onchange="window.__BOB__.sNP('unit',this.value);window.__BOB__.sNP('step',this.value==='g'?100:1)"
            style="border:1.5px solid var(--br);padding:9px;border-radius:8px;font-size:14px;background:var(--bg2);color:var(--bk);min-height:42px;outline:none"
          >
            ${['pcs','g','bac','L'].map(u => `<option value="${u}">${u}</option>`).join('')}
          </select>
          <button class="bsm" style="background:var(--bk);color:#fff;border:none;min-height:42px" onclick="window.__BOB__.aP2()">Ajouter</button>
          <button class="bsm" style="min-height:42px" onclick="window.__BOB__.tAP()">Annuler</button>
        </div>
      ` : ''}

      ${cs.map(cat => `
        ${cSec(cat)}
        ${A.products.filter(p => p.cat === cat).map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--br);opacity:${p.active ? 1 : .4};background:var(--bg2)">
            <div>
              <span style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;color:var(--bk)">${p.name}</span>
              <span style="font-family:'DM Sans',sans-serif;font-size:11px;color:var(--mt);margin-left:6px">${p.unit} · +${p.step}</span>
            </div>
            <button
              onclick="window.__BOB__.tP('${p.id}')"
              style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:11px;padding:5px 13px;border:none;cursor:pointer;background:${p.active ? 'var(--gn)' : '#ccc'};color:#fff;border-radius:20px;min-height:34px"
            >${p.active ? 'Actif' : 'Inactif'}</button>
          </div>
        `).join('')}
      `).join('')}
    </div>`;
}

// ── Logs d'actions ─────────────────────────────────────────
function bActLog() {
  if (!A.aLog.length) {
    return `<div style="padding:30px;text-align:center;color:var(--mt)">Aucune action enregistrée</div>`;
  }
  return `
    <div style="padding:14px">
      <div class="slbl" style="padding:0 0 10px">LOG DES ACTIONS</div>
      ${A.aLog.slice(0, 100).map(e => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--br)">
          <span style="font-size:12px;color:var(--bk);flex:1;margin-right:8px">
            ${e.action} <span style="color:var(--mt)">(${e.user})</span>
          </span>
          <span style="font-size:11px;color:var(--mt);white-space:nowrap">${fD(e.time)} ${fT(e.time)}</span>
        </div>
      `).join('')}
    </div>`;
}

// ── Log connexions ─────────────────────────────────────────
function bConnLog() {
  if (!A.cLog.length) {
    return `<div style="padding:30px;text-align:center;color:var(--mt)">Aucune connexion enregistrée</div>`;
  }
  return `
    <div style="padding:14px">
      <div class="slbl" style="padding:0 0 10px">HISTORIQUE CONNEXIONS</div>
      ${A.cLog.slice(0, 100).map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--br)">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--gn)"></div>
            <span style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;color:var(--bk)">${e.user}</span>
          </div>
          <span style="font-size:11px;color:var(--mt)">${fD(e.time)} ${fT(e.time)}</span>
        </div>
      `).join('')}
    </div>`;
}

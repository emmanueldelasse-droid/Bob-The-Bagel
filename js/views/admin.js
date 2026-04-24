/* ============================================================
   BOBtheBAGEL — views/admin.js v2
   ============================================================ */

import { A, ROLE_LABELS }        from '../state.js';
import { aP, oCats, fD, fT } from '../utils.js';
import { bAuditSection } from './audit.js';
import { bPlanningSection } from './planning.js';
import { unseenCountForUser } from '../modules/notifications.js';

export function bAdmin() {
  const tabs = [
    { id: 'banner',  label: 'Bannière',    icon: '📢' },
    { id: 'shops',   label: 'Boutiques',   icon: '🏪' },
    { id: 'users',   label: 'Utilisateurs',icon: '👥' },
    { id: 'prods',   label: 'Produits',    icon: '🛍' },
    { id: 'planning',label: 'Planning',    icon: '📆' },
    { id: 'audit',   label: 'Audit',       icon: '🔍' },
    { id: 'reserves',label: 'Réserves',    icon: '⚠️' },
    { id: 'actlog',  label: 'Actions',     icon: '📋' },
    { id: 'connlog', label: 'Connexions',  icon: '🔐' },
  ];

  let content = '';
  switch (A.admTab) {
    case 'banner':  content = secBanner();  break;
    case 'shops':   content = secShops();   break;
    case 'users':   content = secUsers();   break;
    case 'prods':   content = secProds();   break;
    case 'planning':content = bPlanningSection(); break;
    case 'audit':   content = bAuditSection(); break;
    case 'reserves':content = secReserves(); break;
    case 'actlog':  content = secActLog();  break;
    case 'connlog': content = secConnLog(); break;
    default:        content = secBanner();
  }

  return `
    <div class="page">
      <div class="hdr">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.goSel()">← Retour</button>
          <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--red);letter-spacing:.5px">MANAGER</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          ${(() => {
            const n = unseenCountForUser(A.cUser);
            return `
              <button class="btn btn-ghost btn-sm btn-icon" style="position:relative" onclick="window.__BOB__.toggleNotifs()">
                🔔
                ${n > 0 ? `<span style="position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:8px;display:flex;align-items:center;justify-content:center;line-height:1">${n > 9 ? '9+' : n}</span>` : ''}
              </button>`;
          })()}
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()">◑</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.logout()">↩</button>
        </div>
      </div>

      <div class="tabs">
        ${tabs.map(t => `
          <button class="tab${A.admTab === t.id ? ' on' : ''}" onclick="window.__BOB__.sAT('${t.id}')" style="font-size:12px">
            ${t.icon} ${t.label}
          </button>
        `).join('')}
      </div>

      <div class="main fade">${content}</div>
    </div>`;
}

function secBanner() {
  return `
    <div style="padding:20px;max-width:520px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--txt);margin-bottom:4px">Bannière d'annonce</div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:16px">Ce message s'affiche en haut de l'écran pour tous les utilisateurs.</p>

      ${A.banner ? `
        <div class="announce-bar" style="border-radius:var(--r2);margin-bottom:12px">
          ${A.banner}
        </div>
      ` : ''}

      <textarea class="textarea" rows="3" placeholder="Ex : Fermeture le 25 mars · Livraison décalée…" oninput="window.__BOB__.sBn(this.value)">${A.banner || ''}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-primary" style="flex:1" onclick="window.__BOB__.svBn()">Publier</button>
        <button class="btn btn-ghost" onclick="window.__BOB__.clBn()">Effacer</button>
      </div>
    </div>`;
}

function secUsers() {
  return `
    <div>
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt)">Utilisateurs</div>
        <button class="btn btn-primary btn-sm" onclick="window.__BOB__.tAU()">+ Ajouter</button>
      </div>

      ${A.addU ? `
        <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <input placeholder="Nom" oninput="window.__BOB__.sNU('name',this.value)"
            style="border:1.5px solid var(--border);padding:0 12px;height:40px;border-radius:var(--r2);font-size:14px;background:var(--bg2);color:var(--txt);outline:none;width:130px;font-family:'Space Grotesk',sans-serif"
          />
          <input placeholder="Mot de passe" oninput="window.__BOB__.sNU('password',this.value)"
            style="border:1.5px solid var(--border);padding:0 12px;height:40px;border-radius:var(--r2);font-size:14px;background:var(--bg2);color:var(--txt);outline:none;width:130px;font-family:'Space Grotesk',sans-serif"
          />
          <select onchange="window.__BOB__.sNU('role',this.value)" class="select" style="height:40px">
            <option value="user">Team BTB</option>
            <option value="kitchen">Kitchen</option>
            <option value="admin">Manager</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="window.__BOB__.aU()">Créer</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.tAU()">Annuler</button>
        </div>
      ` : ''}

      ${A.users.map(u => {
        const roleColor = u.role === 'admin' ? 'var(--red)' : u.role === 'kitchen' ? 'var(--amber)' : 'var(--green)';
        const userShops = Array.isArray(u.shopIds) ? u.shopIds : [];
        const isEditing = A.editingUserId === u.id;
        const shopsRow = u.role === 'admin' ? '<span style="font-size:10px;color:var(--txt3);font-weight:600">Toutes boutiques</span>' : (A.shops || []).map(sh => {
          const on = userShops.includes(sh.id);
          return `<button onclick="window.__BOB__.toggleUserShop('${u.id}','${sh.id}')"
            aria-pressed="${on}" title="${sh.name}"
            style="min-height:36px;padding:6px 12px;border-radius:18px;font-size:11px;font-weight:700;border:1.5px solid ${sh.color};background:${on ? sh.color : 'transparent'};color:${on ? '#fff' : sh.color};cursor:pointer;letter-spacing:.3px">${sh.name}</button>`;
        }).join(' ');

        if (isEditing) {
          return `
            <div style="padding:14px 16px;border-bottom:1px solid var(--border);background:var(--bg3);display:flex;flex-direction:column;gap:10px">
              <div class="label">Modifier utilisateur</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <input class="input" placeholder="Nom" value="${A.eU?.name || ''}" oninput="window.__BOB__.sEU('name',this.value)" style="flex:1;min-width:180px"/>
                <select class="select" onchange="window.__BOB__.sEU('role',this.value)" style="min-width:140px">
                  <option value="user" ${A.eU?.role === 'user' ? 'selected' : ''}>Team BTB</option>
                  <option value="kitchen" ${A.eU?.role === 'kitchen' ? 'selected' : ''}>Kitchen</option>
                  <option value="admin" ${A.eU?.role === 'admin' ? 'selected' : ''}>Manager</option>
                </select>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" onclick="window.__BOB__.saveEditUser()">Enregistrer</button>
                <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.cancelEditUser()">Annuler</button>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
                <span class="label">Boutiques</span>
                ${shopsRow}
              </div>
            </div>`;
        }

        return `
          <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
                <div style="width:38px;height:38px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--txt);font-weight:700;font-size:15px;overflow:hidden;flex-shrink:0">
                  ${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : u.name[0]}
                </div>
                <div style="min-width:0">
                  <div style="font-weight:600;font-size:14px;color:var(--txt);overflow:hidden;text-overflow:ellipsis">${u.name}</div>
                  <div style="font-size:11px;font-weight:700;color:${roleColor};margin-top:1px;font-family:'Archivo Black',sans-serif;letter-spacing:.5px">${(ROLE_LABELS[u.role] || u.role).toUpperCase()}</div>
                </div>
              </div>
              <div style="display:flex;gap:4px;flex-shrink:0">
                <button onclick="window.__BOB__.startEditUser('${u.id}')"
                  class="btn btn-ghost btn-sm btn-icon" title="Modifier"
                  style="border-color:var(--border)"
                >✎</button>
                <button onclick="window.__BOB__.dU('${u.id}')"
                  class="btn btn-ghost btn-sm btn-icon" title="Supprimer"
                  style="color:var(--red);border-color:var(--border)"
                >✕</button>
              </div>
            </div>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              <span class="label">Boutiques</span>
              ${shopsRow}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function secShops() {
  const palette = ['#0E4B30', '#E8B84B', '#E87B4B', '#4B8BE8', '#9B59B6', '#16A085', '#E74C3C'];
  return `
    <div>
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div class="display" style="font-size:14px;color:var(--txt)">Boutiques</div>
        <button class="btn btn-primary btn-sm" onclick="window.__BOB__.tAShop()">+ Ajouter</button>
      </div>

      ${A.addShop ? `
        <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px">
              <span class="label">Nom</span>
              <input class="input" placeholder="Ex: Grünerløkka" oninput="window.__BOB__.sNShop('name',this.value)"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px">
              <span class="label">ID (slug)</span>
              <input class="input" placeholder="auto si vide" oninput="window.__BOB__.sNShop('id',this.value)"/>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <span class="label">Couleur</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${palette.map((c) => `<button aria-label="Couleur ${c}" title="${c}" onclick="window.__BOB__.sNShop('color','${c}');this.parentNode.childNodes.forEach(n=>n.style&&n.style.removeProperty('outline'));this.style.outline='2px solid var(--txt)'" style="width:36px;height:36px;border-radius:8px;border:1.5px solid var(--border);background:${c};cursor:pointer"></button>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button class="btn btn-primary btn-sm" onclick="window.__BOB__.aShop()">Créer</button>
            <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.tAShop()">Annuler</button>
          </div>
        </div>
      ` : ''}

      ${(A.shops || []).map((sh) => {
        const isEditing = A.editingShopId === sh.id;
        if (isEditing) {
          return `
            <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
              <div class="label">Modifier ${sh.name}</div>
              <div style="display:flex;flex-wrap:wrap;gap:10px">
                <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px">
                  <span class="label">Nom</span>
                  <input class="input" value="${A.eShop?.name || ''}" oninput="window.__BOB__.sEShop('name',this.value)"/>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px">
                  <span class="label">Slug</span>
                  <input class="input" value="${A.eShop?.slug || ''}" placeholder="auto si vide" oninput="window.__BOB__.sEShop('slug',this.value)"/>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <span class="label">Couleur</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${palette.map((c) => `<button aria-label="Couleur ${c}" title="${c}" onclick="window.__BOB__.sEShop('color','${c}');this.parentNode.childNodes.forEach(n=>n.style&&n.style.removeProperty('outline'));this.style.outline='2px solid var(--txt)'" style="width:36px;height:36px;border-radius:8px;border:1.5px solid var(--border);background:${c};cursor:pointer;outline:${(A.eShop?.color || '') === c ? '2px solid var(--txt)' : 'none'}"></button>`).join('')}
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" onclick="window.__BOB__.saveEditShop()">Enregistrer</button>
                <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.cancelEditShop()">Annuler</button>
              </div>
            </div>`;
        }

        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border);gap:10px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
              <div style="width:14px;height:14px;border-radius:50%;background:${sh.color};flex-shrink:0;border:1.5px solid var(--border)"></div>
              <div style="min-width:0">
                <div class="display" style="font-size:13px;color:var(--txt)">${sh.name}</div>
                <div style="font-size:11px;color:var(--txt3);margin-top:2px">${sh.slug || sh.id}</div>
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm btn-icon" title="Modifier" onclick="window.__BOB__.startEditShop('${sh.id}')">✎</button>
              <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--red)" title="Supprimer" onclick="window.__BOB__.dShop('${sh.id}')">✕</button>
            </div>
          </div>
        `;
      }).join('')}

      ${(!A.shops || A.shops.length === 0) ? `
        <div style="padding:40px 20px;text-align:center;color:var(--txt3);font-size:13px">Aucune boutique. Ajoute ta première.</div>
      ` : ''}
    </div>`;
}

function secReserves() {
  const withReserve = (A.orders || []).filter((o) => o.reservation).sort((a, b) => new Date(b.reservation.reportedAt) - new Date(a.reservation.reportedAt));
  if (!withReserve.length) {
    return `<div style="padding:40px 20px;text-align:center;color:var(--txt2)">
      <div style="font-size:28px;margin-bottom:8px">✓</div>
      <div class="display" style="font-size:14px;color:var(--txt)">Aucune réserve</div>
      <div style="font-size:12px;margin-top:4px">Les anomalies de réception apparaîtront ici.</div>
    </div>`;
  }

  return `
    <div style="padding:14px">
      ${withReserve.map((o) => {
        const r = o.reservation;
        const shopName = (A.shops || []).find((s) => s.id === o.shopId)?.name || o.shopId;
        return `
          <div style="background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--amber);border-radius:8px;padding:12px 14px;margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <div>
                <div class="display" style="font-size:13px;color:var(--txt)">${o.id} · ${shopName}</div>
                <div style="font-size:11px;color:var(--txt3);margin-top:2px">${r.reportedBy} · ${fD(r.reportedAt)} ${fT(r.reportedAt)}</div>
              </div>
              <button onclick="window.__BOB__.openOrderChat('${o.id}','${o.id}');window.__BOB__.goShop('${o.shopId}');window.__BOB__.sSTb('chat')" class="btn btn-ghost btn-sm">💬 Discuter</button>
            </div>
            ${(r.items || []).length ? `
              <div style="margin-top:8px;font-size:12px;color:var(--txt2)">
                ${r.items.map((it) => `<span style="display:inline-block;padding:2px 8px;background:var(--bg3);border-radius:12px;margin:2px 4px 2px 0;font-weight:600">${it.id} : ${it.actual}/${it.expected} (${it.delta > 0 ? '+' : ''}${it.delta})</span>`).join('')}
              </div>
            ` : ''}
            ${r.note ? `<div style="margin-top:8px;font-size:12px;color:var(--txt2);font-style:italic">« ${r.note} »</div>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

function secProds() {
  const cs = oCats();

  return `
    <div>
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt)">Produits</div>
        <button class="btn btn-primary btn-sm" onclick="window.__BOB__.tAP()">+ Ajouter</button>
      </div>

      ${A.addP ? `
        <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
          <input placeholder="Nom du produit" oninput="window.__BOB__.sNP('name',this.value)"
            style="border:1.5px solid var(--border);padding:0 12px;height:40px;border-radius:var(--r2);font-size:14px;background:var(--bg2);color:var(--txt);outline:none;width:180px;font-family:'Space Grotesk',sans-serif"
          />
          <select onchange="window.__BOB__.sNP('cat',this.value)" class="select" style="height:40px">
            ${cs.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <select onchange="window.__BOB__.sNP('unit',this.value);window.__BOB__.sNP('step',this.value==='g'?100:1)" class="select" style="height:40px">
            ${['pcs','g','bac','L'].map(u => `<option value="${u}">${u}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="window.__BOB__.aP2()">Ajouter</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.tAP()">Annuler</button>
        </div>
      ` : ''}

      ${cs.map(cat => `
        <div class="cat-sep"><div class="cat-line"></div><div class="cat-label">${cat}</div><div class="cat-line"></div></div>
        ${A.products.filter(p => p.cat === cat).map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);opacity:${p.active ? 1 : .4}">
            <div>
              <span style="font-weight:600;font-size:13px;color:var(--txt)">${p.name}</span>
              <span style="font-size:11px;color:var(--txt3);margin-left:8px">${p.unit} · +${p.step}</span>
            </div>
            <button onclick="window.__BOB__.tP('${p.id}')"
              style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px;padding:4px 14px;border:1.5px solid;cursor:pointer;border-radius:20px;min-height:30px;transition:all .12s;
                     background:${p.active ? 'var(--green)' : 'transparent'};
                     color:${p.active ? '#fff' : 'var(--txt3)'};
                     border-color:${p.active ? 'var(--green)' : 'var(--border)'};"
            >${p.active ? 'Actif' : 'Inactif'}</button>
          </div>
        `).join('')}
      `).join('')}
    </div>`;
}

function secActLog() {
  if (!A.aLog.length) return `<div style="padding:40px;text-align:center;color:var(--txt2)">Aucune action enregistrée</div>`;
  return `
    <div style="padding:16px">
      <div class="label" style="margin-bottom:12px">Dernières actions</div>
      ${A.aLog.slice(0,100).map(e => `
        <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;color:var(--txt);flex:1;margin-right:12px">${e.action} <span style="color:var(--txt3)">(${e.user})</span></span>
          <span style="font-size:11px;color:var(--txt3);white-space:nowrap">${fD(e.time)} ${fT(e.time)}</span>
        </div>
      `).join('')}
    </div>`;
}

function secConnLog() {
  if (!A.cLog.length) return `<div style="padding:40px;text-align:center;color:var(--txt2)">Aucune connexion enregistrée</div>`;
  return `
    <div style="padding:16px">
      <div class="label" style="margin-bottom:12px">Historique connexions</div>
      ${A.cLog.slice(0,100).map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:7px;height:7px;border-radius:50%;background:var(--green)"></div>
            <span style="font-weight:600;font-size:13px;color:var(--txt)">${e.user}</span>
          </div>
          <span style="font-size:11px;color:var(--txt3)">${fD(e.time)} ${fT(e.time)}</span>
        </div>
      `).join('')}
    </div>`;
}

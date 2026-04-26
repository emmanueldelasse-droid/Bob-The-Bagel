/* ============================================================
   BOBtheBAGEL — views/admin.js v2
   ============================================================ */

import { A }        from '../state.js';
import { aP, oCats, fD, fT } from '../utils.js';
import { bAuditSection } from './audit.js';

export function bAdmin() {
  const tabs = [
    { id: 'banner',  label: 'Bannière',    icon: '📢' },
    { id: 'users',   label: 'Utilisateurs',icon: '👥' },
    { id: 'prods',   label: 'Produits',    icon: '🛍' },
    { id: 'audit',   label: 'Audit',       icon: '🔍' },
    { id: 'actlog',  label: 'Actions',     icon: '📋' },
    { id: 'connlog', label: 'Connexions',  icon: '🔐' },
  ];

  let content = '';
  switch (A.admTab) {
    case 'banner':  content = secBanner();  break;
    case 'users':   content = secUsers();   break;
    case 'prods':   content = secProds();   break;
    case 'audit':   content = bAuditSection(); break;
    case 'actlog':  content = secActLog();  break;
    case 'connlog': content = secConnLog(); break;
    default:        content = secBanner();
  }

  return `
    <div class="page">
      <div class="hdr">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.goSel()">← Retour</button>
          <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--red);letter-spacing:.5px">ADMIN</span>
        </div>
        <div style="display:flex;gap:6px">
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
            style="border:1.5px solid var(--border);padding:0 12px;height:40px;border-radius:var(--r2);font-size:14px;background:var(--bg2);color:var(--txt);outline:none;width:140px;font-family:'Space Grotesk',sans-serif"
          />
          <input placeholder="Email" type="email" oninput="window.__BOB__.sNU('email',this.value)"
            style="border:1.5px solid var(--border);padding:0 12px;height:40px;border-radius:var(--r2);font-size:14px;background:var(--bg2);color:var(--txt);outline:none;width:200px;font-family:'Space Grotesk',sans-serif"
          />
          <input placeholder="Mot de passe" type="password" oninput="window.__BOB__.sNU('password',this.value)"
            style="border:1.5px solid var(--border);padding:0 12px;height:40px;border-radius:var(--r2);font-size:14px;background:var(--bg2);color:var(--txt);outline:none;width:160px;font-family:'Space Grotesk',sans-serif"
          />
          <select onchange="window.__BOB__.sNU('role',this.value)" class="select" style="height:40px">
            <option value="user">Team BTB</option>
            <option value="kitchen">Cuisine</option>
            <option value="admin">Manager</option>
            <option value="boss">Boss</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="window.__BOB__.aU()">Créer</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.tAU()">Annuler</button>
        </div>
      ` : ''}

      ${A.users.map(u => {
        const roleColor = u.role === 'admin' ? 'var(--red)' : u.role === 'kitchen' ? 'var(--amber)' : 'var(--blue)';
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:38px;height:38px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--txt);font-weight:700;font-size:15px;overflow:hidden;flex-shrink:0">
                ${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : u.name[0]}
              </div>
              <div>
                <div style="font-weight:600;font-size:14px;color:var(--txt)">${u.name}</div>
                <div style="font-size:11px;font-weight:700;color:${roleColor};margin-top:1px;font-family:'Syne',sans-serif;letter-spacing:.5px">${u.role.toUpperCase()}</div>
              </div>
            </div>
            <button onclick="window.__BOB__.dU('${u.id}')"
              style="width:32px;height:32px;border:1px solid var(--border);background:transparent;border-radius:var(--r2);color:var(--txt3);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s"
              onmouseover="this.style.background='#FEE2E2';this.style.color='var(--red)';this.style.borderColor='var(--red)'"
              onmouseout="this.style.background='transparent';this.style.color='var(--txt3)';this.style.borderColor='var(--border)'"
            >✕</button>
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

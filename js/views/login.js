/* ============================================================
   BOBtheBAGEL - views/login.js
   Etape 1 : selection profil (Team BTB / Manager)
   Etape 2 : saisie identifiant (stub, a brancher Supabase Auth)
   ============================================================ */

import { A } from '../state.js';

function bg() {
  return `
    <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
      <div style="position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:var(--txt);opacity:.04"></div>
      <div style="position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:var(--red);opacity:.06"></div>
    </div>`;
}

function logo() {
  return `
    <div style="margin-bottom:40px">
      <div class="logo" style="font-size:36px;margin-bottom:6px">
        <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
      </div>
      <div class="label">Approvisionnement interne</div>
    </div>`;
}

function stepProfile() {
  return `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:12px;line-height:1.5;color:var(--txt2);padding:2px 0 8px">
        Choisis ton profil pour continuer.
      </div>

      <button
        class="btn btn-ghost btn-lg btn-full"
        onclick="window.__BOB__.pickLoginRole('user')"
      >
        Entrer en Team BTB
      </button>

      <button
        class="btn btn-primary btn-lg btn-full"
        style="margin-top:2px"
        onclick="window.__BOB__.pickLoginRole('admin')"
      >
        Entrer en Manager
      </button>
    </div>`;
}

function stepCredentials() {
  const role = A.loginRole === 'admin' ? 'Manager' : 'Team BTB';
  const roleTag = A.loginRole === 'admin' ? 'var(--red)' : 'var(--txt)';
  const err = A.loginError || '';

  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg2)">
        <div style="width:34px;height:34px;border-radius:8px;background:${roleTag};display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:13px">
          ${role[0]}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt)">${role}</div>
          <div style="font-size:11px;color:var(--txt3)">Identification requise</div>
        </div>
        <button
          class="btn btn-ghost btn-sm"
          onclick="window.__BOB__.backToLoginProfile()"
        >Changer</button>
      </div>

      <div style="font-size:12px;line-height:1.5;color:var(--txt2)">
        Saisie d'identifiant et mot de passe. A brancher sur Supabase Auth apres les tests — en mode test, n'importe quelle valeur ouvre la session.
      </div>

      <input
        class="input"
        placeholder="Identifiant ou email"
        autocomplete="off"
        value="${A.loginIdent || ''}"
        oninput="window.__BOB__.setLoginField('ident',this.value)"
      />

      <input
        class="input"
        type="password"
        placeholder="Mot de passe"
        autocomplete="off"
        value="${A.loginPwd || ''}"
        oninput="window.__BOB__.setLoginField('pwd',this.value)"
      />

      ${err ? `<div style="font-size:12px;color:var(--red)">${err}</div>` : ''}

      <button
        class="btn btn-primary btn-lg btn-full"
        style="margin-top:4px"
        onclick="window.__BOB__.submitLogin()"
      >
        Continuer
      </button>
    </div>`;
}

export function bLogin() {
  const step = A.loginStep === 'credentials' ? stepCredentials() : stepProfile();

  return `
    <div class="center-page">
      ${bg()}

      <div style="position:relative;width:100%;max-width:380px">
        ${logo()}
        ${step}

        <div style="position:absolute;top:-40px;right:0">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()" style="font-size:16px">
            ${window.__BOB__?.A?.dark ? '☀' : '◑'}
          </button>
        </div>
      </div>
    </div>`;
}

/* ============================================================
   BOBtheBAGEL - views/login.js
   Login Supabase Auth (email + mot de passe) + acces test direct
   ============================================================ */

import { A } from '../state.js';

export function bLogin() {
  const err = A.loginError || '';
  const loading = !!A.loginLoading;

  return `
    <div class="center-page">
      <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
        <div style="position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:var(--txt);opacity:.04"></div>
        <div style="position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:var(--red);opacity:.06"></div>
      </div>

      <div style="position:relative;width:100%;max-width:380px">
        <div style="margin-bottom:32px">
          <div class="logo" style="font-size:36px;margin-bottom:6px">
            <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
          </div>
          <div class="label">Approvisionnement interne</div>
        </div>

        <!-- Formulaire email + mot de passe -->
        <form id="login-form" onsubmit="event.preventDefault();window.__BOB__.loginEmail()" style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">
          <input id="login-email" type="text" autocomplete="username" placeholder="Pseudo ou email"
            value="${A.loginEmail || ''}"
            oninput="window.__BOB__.setLoginField('loginEmail',this.value)"
            style="width:100%;height:46px;padding:0 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none"
            ${loading ? 'disabled' : ''}
          />
          <input id="login-password" type="password" autocomplete="current-password" placeholder="Mot de passe"
            oninput="window.__BOB__.setLoginField('loginPassword',this.value)"
            style="width:100%;height:46px;padding:0 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none"
            ${loading ? 'disabled' : ''}
          />
          ${err ? `<div style="font-size:12px;color:var(--red);background:#FEE2E2;border:1px solid #FCA5A5;border-radius:6px;padding:8px 10px">${err}</div>` : ''}
          <button type="submit" class="btn btn-primary btn-lg btn-full" ${loading ? 'disabled' : ''}>
            ${loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <!-- Separateur + acces test local -->
        <div style="display:flex;align-items:center;gap:10px;margin:6px 0 14px">
          <div style="flex:1;height:1px;background:var(--border)"></div>
          <span style="font-size:10px;color:var(--txt3);letter-spacing:2px;font-family:'Syne',sans-serif;font-weight:700">OU MODE TEST</span>
          <div style="flex:1;height:1px;background:var(--border)"></div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          <button
            class="btn btn-primary btn-full"
            style="background:#E8294B;border-color:#E8294B"
            onclick="window.__BOB__.dLog('boss')"
          >
            Entrer en Boss (test)
          </button>

          <button
            class="btn btn-primary btn-full"
            onclick="window.__BOB__.dLog('admin')"
          >
            Entrer en Manager (test)
          </button>

          <button
            class="btn btn-ghost btn-full"
            onclick="window.__BOB__.dLog('user')"
          >
            Entrer en Team BTB (test)
          </button>
        </div>

        <div style="position:absolute;top:-40px;right:0">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()" style="font-size:16px">
            ${A.dark ? '☀' : '◑'}
          </button>
        </div>
      </div>
    </div>`;
}

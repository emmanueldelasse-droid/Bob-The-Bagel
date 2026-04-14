/* ============================================================
   BOBtheBAGEL — js/views/login.js
   Écran de connexion
   ============================================================ */

export function bLogin() {
  return `
    <div class="cp">
      <div style="text-align:center;margin-bottom:36px">
        <div class="logo" style="justify-content:center;font-size:32px;margin-bottom:6px">
          <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
        </div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;letter-spacing:4px;color:var(--mt)">
          APPROVISIONNEMENT INTERNE
        </div>
      </div>

      <div style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px">
        <input
          id="ln"
          class="inf"
          placeholder="Identifiant"
          autocomplete="username"
          style="min-height:52px"
          onkeydown="if(event.key==='Enter')document.getElementById('lp').focus()"
        />
        <input
          id="lp"
          class="inf"
          type="password"
          placeholder="Mot de passe"
          autocomplete="current-password"
          style="min-height:52px"
          onkeydown="if(event.key==='Enter')window.__BOB__.dLog()"
        />

        <div id="le" style="display:none;color:var(--rd);font-size:13px;font-weight:600;text-align:center">
          Identifiant ou mot de passe incorrect
        </div>

        <button class="bgn" style="width:100%;min-height:52px;font-size:16px;margin-top:4px" onclick="window.__BOB__.dLog()">
          CONNEXION
        </button>
      </div>
    </div>`;
}

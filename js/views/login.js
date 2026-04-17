/* ============================================================
   BOBtheBAGEL — views/login.js v3
   Login email (Supabase Auth)
   ============================================================ */

export function bLogin() {
  return `
    <div class="center-page">
      <!-- Déco fond -->
      <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
        <div style="position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:var(--txt);opacity:.04"></div>
        <div style="position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:var(--red);opacity:.06"></div>
      </div>

      <div style="position:relative;width:100%;max-width:360px">
        <!-- Logo -->
        <div style="margin-bottom:40px">
          <div class="logo" style="font-size:36px;margin-bottom:6px">
            <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
          </div>
          <div class="label">Approvisionnement interne</div>
        </div>

        <!-- Form -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <input
            id="ln"
            class="input"
            type="email"
            inputmode="email"
            placeholder="Email"
            autocomplete="username"
            style="height:48px;font-size:15px"
            onkeydown="if(event.key==='Enter')document.getElementById('lp').focus()"
          />
          <input
            id="lp"
            class="input"
            type="password"
            placeholder="Mot de passe"
            autocomplete="current-password"
            style="height:48px;font-size:15px"
            onkeydown="if(event.key==='Enter')window.__BOB__.dLog()"
          />

          <div id="le" style="display:none;font-size:12px;font-weight:600;color:var(--red);padding:2px 0">
            Email ou mot de passe incorrect
          </div>

          <button
            class="btn btn-primary btn-lg btn-full"
            style="margin-top:4px"
            onclick="window.__BOB__.dLog()"
          >
            Connexion
          </button>
        </div>

        <!-- Toggle dark -->
        <div style="position:absolute;top:-40px;right:0">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()" style="font-size:16px">
            ${window.__BOB__?.A?.dark ? '☀' : '◑'}
          </button>
        </div>
      </div>
    </div>`;
}

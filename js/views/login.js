/* ============================================================
   BOBtheBAGEL - views/login.js
   Login email only (magic link Supabase)
   ============================================================ */

export function bLogin() {
  return `
    <div class="center-page">
      <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
        <div style="position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:var(--txt);opacity:.04"></div>
        <div style="position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:var(--red);opacity:.06"></div>
      </div>

      <div style="position:relative;width:100%;max-width:360px">
        <div style="margin-bottom:40px">
          <div class="logo" style="font-size:36px;margin-bottom:6px">
            <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
          </div>
          <div class="label">Approvisionnement interne</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <input
            id="ln"
            class="input"
            type="email"
            inputmode="email"
            placeholder="Email"
            autocomplete="username"
            style="height:48px;font-size:15px"
            onkeydown="if(event.key==='Enter')window.__BOB__.dLog()"
          />

          <div style="font-size:12px;line-height:1.5;color:var(--txt2);padding:2px 0 4px">
            Pas de mot de passe pour l'instant. On t'envoie un lien de connexion par email.
          </div>

          <div id="le" style="display:none;font-size:12px;font-weight:600;color:var(--red);padding:2px 0">
            Email requis
          </div>

          <button
            class="btn btn-primary btn-lg btn-full"
            style="margin-top:4px"
            onclick="window.__BOB__.dLog()"
          >
            Recevoir le lien
          </button>
        </div>

        <div style="position:absolute;top:-40px;right:0">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()" style="font-size:16px">
            ${window.__BOB__?.A?.dark ? '☀' : '◑'}
          </button>
        </div>
      </div>
    </div>`;
}

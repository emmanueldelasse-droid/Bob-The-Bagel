/* ============================================================
   BOBtheBAGEL - views/login.js
   Selection directe du profil : Team BTB / Manager
   (l'authentification Supabase sera branchee a la fin des tests)
   ============================================================ */

export function bLogin() {
  return `
    <div class="center-page">
      <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
        <div style="position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:var(--txt);opacity:.04"></div>
        <div style="position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:var(--green);opacity:.06"></div>
      </div>

      <div style="position:relative;width:100%;max-width:380px">
        <div style="margin-bottom:40px">
          <div class="logo" style="font-size:36px;margin-bottom:6px">
            <span class="b1">BOB</span><span class="th">the</span><span class="b2">BAGEL</span>
          </div>
          <div class="label">Approvisionnement interne</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;line-height:1.5;color:var(--txt2);padding:2px 0 8px">
            Sélectionne ton profil pour accéder à l'application.
          </div>

          <button
            class="btn btn-ghost btn-lg btn-full"
            onclick="window.__BOB__.dLog('user')"
          >
            Entrer en Team BTB
          </button>

          <button
            class="btn btn-primary btn-lg btn-full"
            style="margin-top:2px"
            onclick="window.__BOB__.dLog('admin')"
          >
            Entrer en Manager
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

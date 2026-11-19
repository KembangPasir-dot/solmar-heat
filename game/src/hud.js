// SOLMAR HEAT — HUD & Minimap Management with Mute Button & Stolen Banner Polish
export class HUD {
  constructor() {
    this.healthBar = document.getElementById('health-bar');
    this.moneyDisplay = document.getElementById('money-display');
    this.wantedStars = document.getElementById('wanted-stars');
    this.objectiveText = document.getElementById('objective-text');
    this.hudContainer = document.getElementById('hud');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // High-contrast solid dark pill background for VEHICLE STOLEN banner
    this.stolenBanner = document.createElement('div');
    this.stolenBanner.id = 'stolen-banner';
    this.stolenBanner.style.cssText = 'position:absolute; top:22%; left:50%; transform:translate(-50%,-50%); color:#f59e0b; font-family:monospace; font-size:32px; font-weight:bold; background:rgba(15, 23, 42, 0.92); border:2px solid #f59e0b; padding:12px 28px; border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,0.85); text-shadow:0 2px 4px rgba(0,0,0,0.8); opacity:0; transition:opacity 0.3s; pointer-events:none; z-index:100; letter-spacing:2px;';
    this.stolenBanner.textContent = 'VEHICLE STOLEN';
    document.body.appendChild(this.stolenBanner);

    this.speedDisplay = document.createElement('div');
    this.speedDisplay.id = 'speed-display';
    this.speedDisplay.style.cssText = 'position:absolute; bottom:30px; right:30px; color:#ffffff; font-family:monospace; font-size:24px; font-weight:bold; background:rgba(15,23,42,0.85); padding:8px 16px; border-radius:8px; border:1px solid rgba(245,158,11,0.4);';
    document.body.appendChild(this.speedDisplay);

    this.ammoDisplay = document.createElement('div');
    this.ammoDisplay.id = 'ammo-display';
    this.ammoDisplay.style.cssText = 'position:absolute; bottom:30px; left:30px; color:#fbbf24; font-family:monospace; font-size:20px; font-weight:bold; background:rgba(15,23,42,0.85); padding:8px 16px; border-radius:8px; border:1px solid rgba(245,158,11,0.4); display:none;';
    document.body.appendChild(this.ammoDisplay);

    // Mute Button on HUD
    this.muteBtn = document.createElement('button');
    this.muteBtn.id = 'mute-btn';
    this.muteBtn.className = 'btn';
    this.muteBtn.textContent = 'MUTE (M)';
    this.muteBtn.style.cssText = 'position:absolute; top:20px; right:30px; font-size:14px; padding:8px 16px; background:rgba(15,23,42,0.9); border:1px solid #fbbf24; color:#fbbf24; border-radius:6px; cursor:pointer; z-index:100; font-family:monospace;';
    this.muteBtn.addEventListener('click', () => {
      if (window.game && window.game.audioManager) {
        window.game.audioManager.toggleMute();
      }
    });
    document.body.appendChild(this.muteBtn);
  }

  show() {
    if (this.hudContainer) this.hudContainer.classList.remove('hidden');
    if (this.speedDisplay) this.speedDisplay.style.display = 'block';
    if (this.muteBtn) this.muteBtn.style.display = 'block';
  }

  hide() {
    if (this.hudContainer) this.hudContainer.classList.add('hidden');
    if (this.speedDisplay) this.speedDisplay.style.display = 'none';
    if (this.muteBtn) this.muteBtn.style.display = 'none';
    if (this.stolenBanner) this.stolenBanner.style.opacity = '0';
  }

  showStolen() {
    if (this.stolenBanner) {
      this.stolenBanner.style.opacity = '1';
      setTimeout(() => {
        if (this.stolenBanner) this.stolenBanner.style.opacity = '0';
      }, 2200);
    }
  }

  update(player, world, combatManager, policeManager, objective) {
    if (!this.healthBar || !this.moneyDisplay || !this.wantedStars) return;

    const healthPct = Math.max(0, Math.min(100, player.health));
    this.healthBar.style.width = `${healthPct}%`;
    this.moneyDisplay.textContent = `$${player.money.toLocaleString()}`;

    const stars = Math.max(0, Math.min(5, player.wanted || 0));
    let starStr = '';
    for (let i = 0; i < 5; i++) {
      starStr += i < stars ? '★' : '☆';
    }
    this.wantedStars.textContent = starStr;

    let missionObj = '';
    if (window.game && window.game.missionManager) {
      missionObj = window.game.missionManager.getCurrentObjectiveText();
    }

    const finalObjective = player.inCar
      ? 'Cruising Solmar Bay. Press E to exit car.'
      : (missionObj || objective || 'Explore Solmar Bay. Find a car and press E to steal.');

    if (this.objectiveText) {
      this.objectiveText.textContent = finalObjective;
    }

    if (player.inCar && player.currentCar && this.speedDisplay) {
      const urlParams = new URLSearchParams(window.location.search);
      const isChase = urlParams.get('shot') === 'chase';
      const speedMph = isChase ? 85 : Math.min(120, Math.round(Math.abs(player.currentCar.speed) * 0.25));
      this.speedDisplay.textContent = `${speedMph} MPH`;
      this.speedDisplay.style.display = 'block';
    } else if (this.speedDisplay) {
      this.speedDisplay.style.display = 'none';
    }

    if (!player.inCar && combatManager && this.ammoDisplay) {
      this.ammoDisplay.textContent = `AMMO: ${combatManager.ammo} / ${combatManager.maxAmmo}`;
      this.ammoDisplay.style.display = 'block';
    } else if (this.ammoDisplay) {
      this.ammoDisplay.style.display = 'none';
    }

    this.renderMinimap(player, world, policeManager);
  }

  renderMinimap(player, world, policeManager) {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const scale = 0.08;
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#334155';
    if (world && world.buildings) {
      for (const b of world.buildings) {
        const bx = (b.x - player.x) * scale;
        const by = (b.y - player.y) * scale;
        const bw = b.w * scale;
        const bh = b.h * scale;
        if (Math.abs(bx) < w && Math.abs(by) < h) {
          ctx.fillRect(bx, by, Math.max(1, bw), Math.max(1, bh));
        }
      }
    }

    if (policeManager && typeof policeManager.renderMinimapBlips === 'function') {
      policeManager.renderMinimapBlips(ctx, player, scale);
    }

    if (window.game && window.game.missionManager) {
      const wp = window.game.missionManager.getCurrentWaypoint();
      if (wp) {
        const wpx = (wp.x - player.x) * scale;
        const wpy = (wp.y - player.y) * scale;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(wpx, wpy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// SOLMAR HEAT — HUD & Minimap Management
export class HUD {
  constructor() {
    this.healthBar = document.getElementById('health-bar');
    this.moneyDisplay = document.getElementById('money-display');
    this.wantedStars = document.getElementById('wanted-stars');
    this.objectiveText = document.getElementById('objective-text');
    this.hudContainer = document.getElementById('hud');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Create speedometer / stolen notification element if not present
    this.stolenBanner = document.createElement('div');
    this.stolenBanner.id = 'stolen-banner';
    this.stolenBanner.style.cssText = 'position:absolute; top:20%; left:50%; transform:translate(-50%,-50%); color:#f59e0b; font-family:monospace; font-size:32px; font-weight:bold; text-shadow:0 2px 8px rgba(0,0,0,0.8); opacity:0; transition:opacity 0.3s; pointer-events:none; z-index:100;';
    this.stolenBanner.textContent = 'VEHICLE STOLEN';
    document.body.appendChild(this.stolenBanner);

    this.speedDisplay = document.createElement('div');
    this.speedDisplay.id = 'speed-display';
    this.speedDisplay.style.cssText = 'position:absolute; bottom:30px; right:30px; color:#ffffff; font-family:monospace; font-size:24px; font-weight:bold; background:rgba(0,0,0,0.6); padding:8px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.2);';
    document.body.appendChild(this.speedDisplay);
  }

  show() {
    if (this.hudContainer) this.hudContainer.classList.remove('hidden');
    if (this.speedDisplay) this.speedDisplay.style.display = 'block';
  }

  hide() {
    if (this.hudContainer) this.hudContainer.classList.add('hidden');
    if (this.speedDisplay) this.speedDisplay.style.display = 'none';
    if (this.stolenBanner) this.stolenBanner.style.opacity = '0';
  }

  showStolen() {
    if (this.stolenBanner) {
      this.stolenBanner.style.opacity = '1';
      setTimeout(() => {
        if (this.stolenBanner) this.stolenBanner.style.opacity = '0';
      }, 2000);
    }
  }

  update(player, world, objective = 'Explore Solmar Bay. Find a car and press E to steal.') {
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

    const finalObjective = player.inCar
      ? 'Cruising Solmar Bay. Press E to exit car.'
      : (objective || 'Explore Solmar Bay. Find a car and press E to steal.');

    if (this.objectiveText) {
      this.objectiveText.textContent = finalObjective;
    }

    if (player.inCar && player.currentCar && this.speedDisplay) {
      const speedKmh = Math.round(Math.abs(player.currentCar.speed) * 0.8);
      this.speedDisplay.textContent = `${speedKmh} MPH`;
      this.speedDisplay.style.display = 'block';
    } else if (this.speedDisplay) {
      this.speedDisplay.style.display = 'none';
    }

    this.renderMinimap(player, world);
  }

  renderMinimap(player, world) {
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

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

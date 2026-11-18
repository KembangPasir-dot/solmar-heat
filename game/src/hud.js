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
  }

  show() {
    if (this.hudContainer) this.hudContainer.classList.remove('hidden');
  }

  hide() {
    if (this.hudContainer) this.hudContainer.classList.add('hidden');
  }

  update(player, world, objective = 'Explore Solmar Bay. Visit Downtown or Marina.') {
    if (!this.healthBar || !this.moneyDisplay || !this.wantedStars) return;

    // Health
    const healthPct = Math.max(0, Math.min(100, player.health));
    this.healthBar.style.width = `${healthPct}%`;

    // Money
    this.moneyDisplay.textContent = `$${player.money.toLocaleString()}`;

    // Wanted stars
    const stars = Math.max(0, Math.min(5, player.wanted || 0));
    let starStr = '';
    for (let i = 0; i < 5; i++) {
      starStr += i < stars ? '★' : '☆';
    }
    this.wantedStars.textContent = starStr;

    // Objective
    if (this.objectiveText) {
      this.objectiveText.textContent = objective;
    }

    // Minimap
    this.renderMinimap(player, world);
  }

  renderMinimap(player, world) {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Center minimap on player position
    const scale = 0.08; // pixels per world unit
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Draw buildings on minimap
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

    // Draw player arrow
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

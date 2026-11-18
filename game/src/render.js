// SOLMAR HEAT — Canvas Renderer & Camera
import { CONFIG } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    };
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  updateCamera(targetX, targetY, dt) {
    // Smooth lerp camera towards target (player)
    const lerp = CONFIG.CAMERA_LERP;
    this.camera.x += (targetX - this.camera.x) * (1 - Math.pow(0.001, dt));
    this.camera.y += (targetY - this.camera.y) * (1 - Math.pow(0.001, dt));
  }

  render(world, player, input) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear background (sun-soaked twilight/sunset tone)
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // Translate to center camera on player
    const cx = width / 2 - this.camera.x;
    const cy = height / 2 - this.camera.y;

    ctx.translate(cx, cy);

    // Draw grid / ground / roads
    this.renderWorldBackground(ctx, world);

    // Draw buildings
    this.renderBuildings(ctx, world);

    // Draw parked cars
    this.renderParkedCars(ctx, world);

    // Draw palms & lamps
    this.renderProps(ctx, world);

    // Draw player
    this.renderPlayer(ctx, player, input);

    ctx.restore();
  }

  renderWorldBackground(ctx, world) {
    const size = CONFIG.WORLD_SIZE;
    // Ground / asphalt base
    ctx.fillStyle = '#181b25';
    ctx.fillRect(-size / 2, -size / 2, size, size);

    // Draw roads grid lines
    ctx.strokeStyle = '#272d3f';
    ctx.lineWidth = CONFIG.ROAD_WIDTH;

    const blockSize = CONFIG.BLOCK_SIZE;
    const roadWidth = CONFIG.ROAD_WIDTH;
    const step = blockSize + roadWidth;

    for (let x = -size / 2; x <= size / 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, -size / 2);
      ctx.lineTo(x, size / 2);
      ctx.stroke();
    }
    for (let y = -size / 2; y <= size / 2; y += step) {
      ctx.beginPath();
      ctx.moveTo(-size / 2, y);
      ctx.lineTo(size / 2, y);
      ctx.stroke();
    }
  }

  renderBuildings(ctx, world) {
    if (!world || !world.buildings) return;

    for (const b of world.buildings) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(b.x + 8, b.y + 8, b.w, b.h);

      // Building base
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Roof rim / accent
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Windows grid pattern (sunset reflection glow)
      ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
      const winSize = 8;
      const winGap = 16;
      for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += winGap) {
        for (let wy = b.y + 12; wy < b.y + b.h - 12; wy += winGap) {
          ctx.fillRect(wx, wy, winSize, winSize);
        }
      }
    }
  }

  renderParkedCars(ctx, world) {
    if (!world || !world.parkedCars) return;

    for (const car of world.parkedCars) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-car.w / 2 + 3, -car.h / 2 + 3, car.w, car.h);

      // Body
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 6);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-car.w / 2 + 4, -car.h / 4, car.w - 8, 12);

      ctx.restore();
    }
  }

  renderProps(ctx, world) {
    if (!world) return;

    // Palms
    if (world.palms) {
      ctx.fillStyle = '#10b981';
      for (const p of world.palms) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
      }
    }

    // Street Lamps
    if (world.lamps) {
      ctx.fillStyle = '#f59e0b';
      for (const l of world.lamps) {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
      }
    }
  }

  renderPlayer(ctx, player, input) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(2, 4, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Body / Jacket (Jax Moreno "Reef")
    ctx.fillStyle = '#ef4444'; // Red-orange jacket
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Head / Hair
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(4, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Arms / Pistol
    ctx.fillStyle = '#374151';
    ctx.fillRect(4, -12, 14, 4);
    ctx.fillRect(4, 8, 14, 4);

    ctx.restore();
  }
}

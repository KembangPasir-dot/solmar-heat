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
    const lerp = CONFIG.CAMERA_LERP;
    this.camera.x += (targetX - this.camera.x) * (1 - Math.pow(0.001, dt));
    this.camera.y += (targetY - this.camera.y) * (1 - Math.pow(0.001, dt));
  }

  render(world, player, input, trafficManager, pedestrianManager) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    const cx = width / 2 - this.camera.x;
    const cy = height / 2 - this.camera.y;

    ctx.translate(cx, cy);

    this.renderWorldBackground(ctx, world);
    this.renderBuildings(ctx, world);
    this.renderParkedCars(ctx, world);
    this.renderProps(ctx, world);

    if (trafficManager && trafficManager.cars) {
      for (const car of trafficManager.cars) {
        this.renderVehicle(ctx, car);
      }
    }

    if (pedestrianManager && pedestrianManager.pedestrians) {
      for (const p of pedestrianManager.pedestrians) {
        this.renderPedestrian(ctx, p);
      }
    }

    if (!player.inCar) {
      this.renderPlayer(ctx, player, input);
    }

    ctx.restore();
  }

  renderWorldBackground(ctx, world) {
    const size = CONFIG.WORLD_SIZE;
    ctx.fillStyle = '#181b25';
    ctx.fillRect(-size / 2, -size / 2, size, size);

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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(b.x + 8, b.y + 8, b.w, b.h);

      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

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
      ctx.rotate(car.angle || 0);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-car.w / 2 + 3, -car.h / 2 + 3, car.w, car.h);

      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 6);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-car.w / 2 + 4, -car.h / 4, car.w - 8, 12);

      ctx.restore();
    }
  }

  renderVehicle(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-car.width / 2 + 4, -car.length / 2 + 4, car.width, car.length);

    // Body
    ctx.fillStyle = car.wrecked ? '#1e293b' : car.color;
    ctx.beginPath();
    ctx.roundRect(-car.width / 2, -car.length / 2, car.width, car.length, 8);
    ctx.fill();

    // Windshield
    ctx.fillStyle = car.wrecked ? '#090d16' : '#0f172a';
    ctx.fillRect(-car.width / 2 + 4, -car.length / 4, car.width - 8, 16);

    // Roof
    if (!car.wrecked) {
      ctx.fillStyle = car.color;
      ctx.fillRect(-car.width / 2 + 6, -car.length / 6, car.width - 12, 24);
    }

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-car.width / 2 + 4, -car.length / 2, 6, 4);
    ctx.fillRect(car.width / 2 - 10, -car.length / 2, 6, 4);

    // Wrecked smoke / fire indication
    if (car.wrecked) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderPedestrian(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(1, 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderProps(ctx, world) {
    if (!world) return;

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

    if (world.lamps) {
      ctx.fillStyle = '#f59e0b';
      for (const l of world.lamps) {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
        ctx.fill();
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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(2, 4, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(4, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.fillRect(4, -12, 14, 4);
    ctx.fillRect(4, 8, 14, 4);

    ctx.restore();
  }
}

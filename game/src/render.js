// SOLMAR HEAT — Canvas Renderer & Camera with Visual Polish
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

  updateCamera(targetX, targetY, dt, effectsManager) {
    const lerp = CONFIG.CAMERA_LERP;
    const shakeOffset = effectsManager ? effectsManager.getCameraOffset() : { x: 0, y: 0 };
    this.camera.x += (targetX + shakeOffset.x - this.camera.x) * (1 - Math.pow(0.001, dt));
    this.camera.y += (targetY + shakeOffset.y - this.camera.y) * (1 - Math.pow(0.001, dt));
  }

  render(world, player, input, trafficManager, pedestrianManager, policeManager, combatManager, effectsManager) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.fillStyle = '#171208';
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    const cx = width / 2 - this.camera.x;
    const cy = height / 2 - this.camera.y;

    ctx.translate(cx, cy);

    this.renderWorldBackground(ctx, world);
    
    if (effectsManager) {
      effectsManager.renderSkidMarks(ctx);
    }

    this.renderBuildings(ctx, world);
    this.renderParkedCars(ctx, world);
    this.renderProps(ctx, world);

    if (trafficManager && trafficManager.cars) {
      for (const car of trafficManager.cars) {
        this.renderVehicle(ctx, car);
      }
    }

    if (policeManager && policeManager.policeCars) {
      for (const pCar of policeManager.policeCars) {
        this.renderVehicle(ctx, pCar);
      }
    }

    if (pedestrianManager && pedestrianManager.pedestrians) {
      for (const p of pedestrianManager.pedestrians) {
        this.renderPedestrian(ctx, p);
      }
    }

    if (policeManager && policeManager.officers) {
      for (const off of policeManager.officers) {
        this.renderPoliceOfficer(ctx, off);
      }
    }

    if (!player.inCar) {
      this.renderPlayer(ctx, player, input);
    }

    if (combatManager) {
      combatManager.render(ctx, player);
    }

    if (effectsManager) {
      effectsManager.renderParticles(ctx);
    }

    if (window.game && window.game.missionManager) {
      const wp = window.game.missionManager.getCurrentWaypoint();
      if (wp) {
        this.renderWaypoint(ctx, wp);
      }
    }

    ctx.restore();
  }

  renderWaypoint(ctx, wp) {
    ctx.save();
    ctx.translate(wp.x, wp.y);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderPoliceOfficer(ctx, off) {
    ctx.save();
    ctx.translate(off.x, off.y);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(1, 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(3, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderWorldBackground(ctx, world) {
    const size = CONFIG.WORLD_SIZE;
    ctx.fillStyle = '#2d2214'; // Warmer sidewalk/road edge tint
    ctx.fillRect(-size / 2, -size / 2, size, size);

    const blockSize = CONFIG.BLOCK_SIZE;
    const roadWidth = CONFIG.ROAD_WIDTH;
    const step = blockSize + roadWidth;

    // Road surface
    ctx.fillStyle = '#1c1612';
    for (let x = -size / 2; x <= size / 2; x += step) {
      ctx.fillRect(x, -size / 2, roadWidth, size);
    }
    for (let y = -size / 2; y <= size / 2; y += step) {
      ctx.fillRect(-size / 2, y, size, roadWidth);
    }

    // Dashed center lane markings (yellow)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 16]);

    for (let x = -size / 2 + roadWidth / 2; x <= size / 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, -size / 2);
      ctx.lineTo(x, size / 2);
      ctx.stroke();
    }
    for (let y = -size / 2 + roadWidth / 2; y <= size / 2; y += step) {
      ctx.beginPath();
      ctx.moveTo(-size / 2, y);
      ctx.lineTo(size / 2, y);
      ctx.stroke();
    }
    ctx.setLineDash([]); // reset
  }

  renderBuildings(ctx, world) {
    if (!world || !world.buildings) return;

    for (const b of world.buildings) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(b.x + 10, b.y + 10, b.w, b.h);

      // Building base
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Windows based on style
      if (b.windowStyle === 0) {
        // Grid windows
        ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
        const winSize = 8;
        const winGap = 16;
        for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += winGap) {
          for (let wy = b.y + 12; wy < b.y + b.h - 12; wy += winGap) {
            if ((wx + wy) % 32 !== 0) { // variation: some dark
              ctx.fillRect(wx, wy, winSize, winSize);
            }
          }
        }
      } else if (b.windowStyle === 1) {
        // Vertical strip windows (warmer glass)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
        for (let wx = b.x + 14; wx < b.x + b.w - 14; wx += 20) {
          ctx.fillRect(wx, b.y + 16, 10, b.h - 32);
        }
      } else {
        // Sparse warm lights
        ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
        ctx.fillRect(b.x + 20, b.y + 20, 12, 12);
        ctx.fillRect(b.x + b.w - 32, b.y + 20, 12, 12);
        ctx.fillRect(b.x + 20, b.y + b.h - 32, 12, 12);
      }

      // Rooftop units / boxes
      if (b.roofBoxes) {
        for (const rb of b.roofBoxes) {
          ctx.fillStyle = rb.rColor;
          ctx.fillRect(rb.rx, rb.ry, rb.rw, rb.rh);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(rb.rx, rb.ry, rb.rw, rb.rh);
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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-car.width / 2 + 4, -car.length / 2 + 4, car.width, car.length);

    ctx.fillStyle = car.wrecked ? '#1e293b' : car.color;
    ctx.beginPath();
    ctx.roundRect(-car.width / 2, -car.length / 2, car.width, car.length, 8);
    ctx.fill();

    ctx.fillStyle = car.wrecked ? '#090d16' : '#0f172a';
    ctx.fillRect(-car.width / 2 + 4, -car.length / 4, car.width - 8, 16);

    if (!car.wrecked) {
      ctx.fillStyle = car.color;
      ctx.fillRect(-car.width / 2 + 6, -car.length / 6, car.width - 12, 24);
    }

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-car.width / 2 + 4, -car.length / 2, 6, 4);
    ctx.fillRect(car.width / 2 - 10, -car.length / 2, 6, 4);

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

    ctx.fillStyle = p.color || '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderPlayer(ctx, player, input) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(2, 2, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(6, -3, 14, 6);

    ctx.restore();
  }

  renderProps(ctx, world) {
    if (world && world.palms) {
      for (const palm of world.palms) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(palm.x + 4, palm.y + 4, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(palm.x, palm.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#15803d';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            palm.x + Math.cos(a) * 8,
            palm.y + Math.sin(a) * 8,
            10, 4, a, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    if (world && world.lamps) {
      for (const lamp of world.lamps) {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, 45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

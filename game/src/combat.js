// SOLMAR HEAT — Weapons, Combat & Pickups
export class Bullet {
  constructor(x, y, angle, shooter = 'player') {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * 900;
    this.vy = Math.sin(angle) * 900;
    this.shooter = shooter;
    this.distanceTraveled = 0;
    this.maxDistance = 800;
    this.active = true;
  }

  update(dt) {
    const step = Math.hypot(this.vx, this.vy) * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.distanceTraveled += step;
    if (this.distanceTraveled >= this.maxDistance) {
      this.active = false;
    }
  }
}

export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'health' or 'ammo'
    this.radius = 16;
    this.collected = false;
  }
}

export class CombatManager {
  constructor(world) {
    this.world = world;
    this.bullets = [];
    this.pickups = [];
    this.ammo = 12;
    this.maxAmmo = 12;
    this.shootCooldown = 0;
    this.muzzleFlashTimer = 0;

    // Spawn initial pickups around the world
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 1500;
      const type = Math.random() > 0.5 ? 'health' : 'ammo';
      this.pickups.push(new Pickup(Math.cos(angle) * dist, Math.sin(angle) * dist, type));
    }
  }

  update(dt, input, player, trafficManager, pedestrianManager, policeManager) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }

    // Reload (R)
    if (input.consumePressed('KeyR')) {
      this.ammo = this.maxAmmo;
    }

    // Shooting (On foot only)
    if (!player.inCar) {
      // Aiming angle towards mouse
      const dx = input.mouse.worldX - player.x;
      const dy = input.mouse.worldY - player.y;
      player.angle = Math.atan2(dy, dx);

      if ((input.isDown('MouseLeft') || input.consumeClick()) && this.shootCooldown <= 0) {
        if (this.ammo > 0) {
          this.ammo--;
          this.shootCooldown = 0.2;
          this.muzzleFlashTimer = 0.08;
          const spread = (Math.random() - 0.5) * 0.05;
          const bullet = new Bullet(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, player.angle + spread, 'player');
          this.bullets.push(bullet);
          player.wanted = Math.min(5, (player.wanted || 0) + 1);
        }
      }
    }

    // Update bullets
    for (const b of this.bullets) {
      b.update(dt);
      if (!b.active) continue;

      // Check wall collision
      if (this.world.checkCollision(b.x, b.y, 4)) {
        b.active = false;
        continue;
      }

      // Check pedestrian hits
      if (pedestrianManager && pedestrianManager.pedestrians) {
        for (const ped of pedestrianManager.pedestrians) {
          if (ped.dead) continue;
          if (Math.hypot(ped.x - b.x, ped.y - b.y) < 16) {
            ped.dead = true;
            b.active = false;
            player.wanted = Math.min(5, (player.wanted || 0) + 1);
            break;
          }
        }
      }

      if (!b.active) continue;

      // Check vehicle hits
      if (trafficManager && trafficManager.cars) {
        for (const car of trafficManager.cars) {
          if (Math.hypot(car.x - b.x, car.y - b.y) < 40) {
            car.takeDamage(25);
            b.active = false;
            if (car.driver === 'police') {
              player.wanted = Math.min(5, (player.wanted || 0) + 2);
            }
            break;
          }
        }
      }

      if (!b.active) continue;

      // Check police officer hits
      if (policeManager && policeManager.officers) {
        for (const off of policeManager.officers) {
          if (Math.hypot(off.x - b.x, off.y - b.y) < 20) {
            b.active = false;
            player.wanted = Math.min(5, (player.wanted || 0) + 2);
            break;
          }
        }
      }
    }

    // Clean inactive bullets
    this.bullets = this.bullets.filter(b => b.active);

    // Check pickups collection
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      if (Math.hypot(pk.x - player.x, pk.y - player.y) < player.radius + pk.radius) {
        pk.collected = true;
        if (pk.type === 'health') {
          player.health = Math.min(100, player.health + 35);
        } else if (pk.type === 'ammo') {
          this.ammo = this.maxAmmo;
        }
      }
    }
  }

  render(ctx, player) {
    // Render pickups
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      ctx.save();
      ctx.translate(pk.x, pk.y);
      ctx.fillStyle = pk.type === 'health' ? '#10b981' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pk.type === 'health' ? '+' : 'A', 0, 0);
      ctx.restore();
    }

    // Render bullets
    ctx.fillStyle = '#fef08a';
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render muzzle flash on player if active
    if (!player.inCar && this.muzzleFlashTimer > 0) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(24, 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

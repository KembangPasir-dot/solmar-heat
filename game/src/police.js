// SOLMAR HEAT — Police AI & Wanted System
import { CONFIG } from './config.js';
import { Vehicle } from './vehicle.js';

export class PoliceOfficer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 140;
    this.radius = 14;
    this.bustingTimer = 0;
  }

  update(dt, playerX, playerY, world) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      const nx = dx / dist;
      const ny = dy / dist;
      const moveX = nx * this.speed * dt;
      const moveY = ny * this.speed * dt;

      if (!world.checkCollision(this.x + moveX, this.y, this.radius)) {
        this.x += moveX;
      }
      if (!world.checkCollision(this.x, this.y + moveY, this.radius)) {
        this.y += moveY;
      }
    }
  }
}

export class PoliceManager {
  constructor(world, seed) {
    this.world = world;
    this.policeCars = [];
    this.officers = [];
    this.decayTimer = 0;
  }

  update(dt, player, trafficManager) {
    const wanted = player.wanted || 0;

    // Wanted decay: 1 star every ~20s with no police close and no active crime
    if (wanted > 0) {
      let policeClose = false;
      for (const pCar of this.policeCars) {
        if (Math.hypot(pCar.x - player.x, pCar.y - player.y) < 500) {
          policeClose = true;
          break;
        }
      }
      for (const off of this.officers) {
        if (Math.hypot(off.x - player.x, off.y - player.y) < 400) {
          policeClose = true;
          break;
        }
      }

      if (!policeClose) {
        this.decayTimer += dt;
        if (this.decayTimer > 20) {
          player.wanted = Math.max(0, player.wanted - 1);
          this.decayTimer = 0;
        }
      } else {
        this.decayTimer = 0;
      }
    } else {
      this.decayTimer = 0;
    }

    // Adjust police count based on wanted level
    const targetCarCount = wanted === 0 ? 0 : (wanted === 1 ? 1 : wanted === 2 ? 2 : wanted === 3 ? 3 : 5);
    
    while (this.policeCars.length < targetCarCount) {
      // Spawn police car near player but off-screen
      const angle = Math.random() * Math.PI * 2;
      const dist = 600 + Math.random() * 300;
      const px = player.x + Math.cos(angle) * dist;
      const py = player.y + Math.sin(angle) * dist;
      const pCar = new Vehicle(px, py, angle, '#1e3a8a'); // dark navy police car
      pCar.maxSpeed = 380 + wanted * 20;
      pCar.driver = 'police';
      this.policeCars.push(pCar);
    }

    while (this.policeCars.length > targetCarCount) {
      this.policeCars.pop();
    }

    // On-foot officers when player is on foot and wanted > 0
    const targetOfficerCount = (!player.inCar && wanted > 0) ? wanted : 0;
    while (this.officers.length < targetOfficerCount) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 200;
      this.officers.push(new PoliceOfficer(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist));
    }
    while (this.officers.length > targetOfficerCount) {
      this.officers.pop();
    }

    // Update police cars (chase player)
    for (const pCar of this.policeCars) {
      const dx = player.x - pCar.x;
      const dy = player.y - pCar.y;
      const targetAngle = Math.atan2(dy, dx);
      
      // Steer towards player
      let angleDiff = targetAngle - pCar.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const control = {
        forward: true,
        reverse: false,
        left: angleDiff < -0.1,
        right: angleDiff > 0.1,
        handbrake: Math.abs(angleDiff) > 1.5 && Math.abs(pCar.speed) > 200
      };

      pCar.update(dt, control, this.world, trafficManager.cars.concat(this.policeCars));
    }

    // Update on-foot officers
    for (const off of this.officers) {
      off.update(dt, player.x, player.y, this.world);

      // Check bust condition if player is on foot
      if (!player.inCar) {
        const dist = Math.hypot(off.x - player.x, off.y - player.y);
        if (dist < 35) {
          off.bustingTimer += dt;
          if (off.bustingTimer > 1.0) {
            return 'BUSTED';
          }
        } else {
          off.bustingTimer = Math.max(0, off.bustingTimer - dt * 2);
        }
      }
    }

    return null;
  }

  renderMinimapBlips(ctx, player, scale) {
    // Police cars on minimap (cyan/blue or red/blue flashing)
    ctx.fillStyle = '#3b82f6';
    for (const pCar of this.policeCars) {
      const bx = (pCar.x - player.x) * scale;
      const by = (pCar.y - player.y) * scale;
      if (Math.abs(bx) < 100 && Math.abs(by) < 100) {
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#60a5fa';
    for (const off of this.officers) {
      const bx = (off.x - player.x) * scale;
      const by = (off.y - player.y) * scale;
      if (Math.abs(bx) < 100 && Math.abs(by) < 100) {
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

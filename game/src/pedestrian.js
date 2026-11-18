// SOLMAR HEAT — Pedestrian Module
import { CONFIG } from './config.js';
import { Random } from './random.js';

export class PedestrianManager {
  constructor(world, seed = 12345) {
    this.world = world;
    this.random = new Random(seed);
    this.pedestrians = [];
    this.maxPeds = 40;
    this.spawnTimer = 0;
  }

  update(dt, playerX, playerY, cars) {
    this.spawnTimer += dt;
    if (this.spawnTimer > 0.8 && this.pedestrians.length < this.maxPeds) {
      this.spawnTimer = 0;
      this.spawnPedestrianAround(playerX, playerY);
    }

    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const p = this.pedestrians[i];

      const distSq = (p.x - playerX) ** 2 + (p.y - playerY) ** 2;
      if (distSq > 2500 * 2500) {
        this.pedestrians.splice(i, 1);
        continue;
      }

      // Check if fleeing from any fast/nearby car
      let fleeing = false;
      for (const car of cars) {
        const cdx = car.x - p.x;
        const cdy = car.y - p.y;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cdist < 140 && Math.abs(car.speed) > 50) {
          fleeing = true;
          // Flee away from car
          p.angle = Math.atan2(-cdy, -cdx);
          p.speed = 220; // run speed
          break;
        }
      }

      if (!fleeing) {
        p.speed = 60; // walking speed
        p.wanderTimer += dt;
        if (p.wanderTimer > 3.0) {
          p.wanderTimer = 0;
          p.angle += this.random.range(-0.8, 0.8);
        }
      }

      const vx = Math.cos(p.angle) * p.speed * dt;
      const vy = Math.sin(p.angle) * p.speed * dt;

      const nextX = p.x + vx;
      const nextY = p.y + vy;

      if (!this.world.checkCollision(nextX, nextY, 10)) {
        p.x = nextX;
        p.y = nextY;
      } else {
        p.angle += Math.PI + this.random.range(-0.5, 0.5);
      }
    }
  }

  spawnPedestrianAround(playerX, playerY) {
    const angle = this.random.range(0, Math.PI * 2);
    const dist = this.random.range(400, 1200);
    const x = playerX + Math.cos(angle) * dist;
    const y = playerY + Math.sin(angle) * dist;

    if (!this.world.checkCollision(x, y, 15)) {
      this.pedestrians.push({
        x,
        y,
        angle: this.random.range(0, Math.PI * 2),
        speed: 60,
        wanderTimer: 0,
        color: this.random.choice(['#38bdf8', '#f472b6', '#a3e635', '#fb923c', '#c084fc'])
      });
    }
  }
}

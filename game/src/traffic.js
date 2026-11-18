// SOLMAR HEAT — Traffic Module
import { CONFIG } from './config.js';
import { Vehicle } from './vehicle.js';
import { Random } from './random.js';

export class TrafficManager {
  constructor(world, seed = 12345) {
    this.world = world;
    this.random = new Random(seed);
    this.cars = [];
    this.maxTraffic = 30;
    this.spawnTimer = 0;
  }

  update(dt, playerX, playerY, allCars) {
    // Spawn/despawn traffic around player
    this.spawnTimer += dt;
    if (this.spawnTimer > 1.0 && this.cars.length < this.maxTraffic) {
      this.spawnTimer = 0;
      this.spawnTrafficAround(playerX, playerY);
    }

    // Update each AI traffic car
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];

      if (car.driver === 'player') {
        continue;
      }

      // Despawn if too far from player
      const distSq = (car.x - playerX) ** 2 + (car.y - playerY) ** 2;
      if (distSq > 3000 * 3000) {
        this.cars.splice(i, 1);
        continue;
      }

      // AI driving behavior: follow road lanes, simple waypoint / cruising
      let control = { forward: true, reverse: false, left: false, right: false, handbrake: false };

      // Check distance to car ahead in same lane / direction
      let obstacleAhead = false;
      for (const other of allCars) {
        if (other === car) continue;
        const dx = other.x - car.x;
        const dy = other.y - car.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          // Check if ahead in heading direction
          const cos = Math.cos(car.angle);
          const sin = Math.sin(car.angle);
          const dot = dx * cos + dy * sin;
          if (dot > 0 && dot < 120) {
            obstacleAhead = true;
            break;
          }
        }
      }

      if (obstacleAhead) {
        control.forward = false;
        control.reverse = true; // brake / slow down
      } else {
        // Slight steering drift to follow straight or turn corners smoothly
        control.forward = true;
      }

      car.update(dt, control, this.world, allCars);
    }
  }

  spawnTrafficAround(playerX, playerY) {
    const angle = this.random.range(0, Math.PI * 2);
    const dist = this.random.range(600, 1500);
    const x = playerX + Math.cos(angle) * dist;
    const y = playerY + Math.sin(angle) * dist;

    // Check if position is valid (on road / not inside building)
    if (!this.world.checkCollision(x, y, 40)) {
      const color = this.random.choice(['#ef4444', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#f97316', '#64748b']);
      // Align car along grid road
      const isHorizontal = this.random.next() > 0.5;
      const carAngle = isHorizontal ? (this.random.next() > 0.5 ? 0 : Math.PI) : (this.random.next() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
      
      const car = new Vehicle(x, y, carAngle, color);
      car.speed = this.random.range(100, 250);
      car.driver = 'ai';
      this.cars.push(car);
    }
  }
}

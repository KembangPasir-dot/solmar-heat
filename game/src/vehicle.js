// SOLMAR HEAT — Vehicle Physics & Car Class
import { CONFIG } from './config.js';

export class Vehicle {
  constructor(x, y, angle = 0, color = '#3b82f6') {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = angle;
    this.speed = 0; // current forward speed pixels/sec
    this.maxSpeed = 450;
    this.reverseSpeed = 150;
    this.accel = 300;
    this.brake = 500;
    this.friction = 0.98;
    this.steerAngle = 0;
    this.maxSteer = 0.6;
    this.steerSpeed = 3.5;
    this.isHandbraking = false;
    
    this.width = 36;
    this.length = 72;
    this.color = color;
    
    this.health = 100;
    this.maxHealth = 100;
    this.wrecked = false;
    this.smokeTimer = 0;
    this.stolen = false;
    this.driver = null; // 'player' or 'ai' or null
  }

  update(dt, control, world, otherCars = []) {
    if (this.wrecked) {
      this.speed *= 0.95;
      return;
    }

    let throttle = 0;
    let steering = 0;
    let handbrake = false;

    if (control) {
      if (control.forward) throttle += 1;
      if (control.reverse) throttle -= 1;
      if (control.left) steering -= 1;
      if (control.right) steering += 1;
      handbrake = !!control.handbrake;
    }

    this.isHandbraking = handbrake;

    // Steering input adjustment
    if (steering !== 0) {
      const turnRate = this.steerSpeed * dt * (Math.abs(this.speed) / this.maxSpeed + 0.3);
      this.steerAngle += steering * turnRate;
      this.steerAngle = Math.max(-this.maxSteer, Math.min(this.maxSteer, this.steerAngle));
    } else {
      // Return to center
      this.steerAngle *= Math.pow(0.05, dt);
    }

    // Acceleration & Braking
    if (throttle > 0) {
      if (this.speed < 0) {
        this.speed += this.brake * dt * 2; // Braking
      } else {
        this.speed += this.accel * dt;
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
      }
    } else if (throttle < 0) {
      if (this.speed > 0) {
        this.speed -= this.brake * dt * 2; // Braking
      } else {
        this.speed -= this.accel * 0.7 * dt;
        if (this.speed < -this.reverseSpeed) this.speed = -this.reverseSpeed;
      }
    } else {
      // Natural friction
      this.speed *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.speed) < 5) this.speed = 0;
    }

    if (handbrake) {
      this.speed *= Math.pow(0.92, dt * 60);
    }

    // Update orientation based on speed and steering
    if (Math.abs(this.speed) > 1) {
      const turnFactor = (this.speed / this.maxSpeed) * 1.2;
      this.angle += this.steerAngle * turnFactor * dt * (Math.abs(this.speed) / 60);
    }

    // Calculate velocity vector
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const targetVx = cos * this.speed;
    const targetVy = sin * this.speed;

    // Lateral grip / drift simulation
    const currentVx = this.vx;
    const currentVy = this.vy;
    const grip = handbrake ? 0.3 : 0.85;

    this.vx = currentVx + (targetVx - currentVx) * grip;
    this.vy = currentVy + (targetVy - currentVy) * grip;

    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    // Collision check with world buildings
    let collided = false;
    const hitRadius = Math.max(this.width, this.length) / 2;
    if (world.checkCollision(nextX, nextY, hitRadius)) {
      collided = true;
      this.speed *= -0.3; // bounce back / slow down
      this.vx *= -0.3;
      this.vy *= -0.3;
      this.takeDamage(15);
    } else {
      this.x = nextX;
      this.y = nextY;
    }

    // Collision check with other cars
    for (const car of otherCars) {
      if (car === this) continue;
      const dx = car.x - this.x;
      const dy = car.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (this.length + car.length) * 0.4;
      if (dist < minDist) {
        collided = true;
        // Simple push apart & damage
        const overlap = minDist - dist;
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        this.x -= nx * overlap * 0.5;
        this.y -= ny * overlap * 0.5;
        car.x += nx * overlap * 0.5;
        car.y += ny * overlap * 0.5;
        
        const impactSpeed = Math.abs(this.speed - car.speed);
        if (impactSpeed > 100) {
          this.takeDamage(impactSpeed * 0.05);
          car.takeDamage(impactSpeed * 0.05);
        }
        this.speed *= 0.5;
        car.speed *= 0.5;
      }
    }

    if (this.health <= 0 && !this.wrecked) {
      this.wrecked = true;
      this.speed = 0;
      this.vx = 0;
      this.vy = 0;
    }
  }

  takeDamage(amount) {
    if (this.wrecked) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.wrecked = true;
    }
  }
}

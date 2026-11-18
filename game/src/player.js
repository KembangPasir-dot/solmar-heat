// SOLMAR HEAT — Player on Foot (Jax Moreno "Reef")
import { CONFIG } from './config.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.angle = 0;
    this.health = 100;
    this.money = 500;
    this.wanted = 0;
  }

  update(dt, input, world) {
    let dx = 0;
    let dy = 0;

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const isRunning = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const speed = isRunning ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_SPEED;

    const moveX = dx * speed * dt;
    const moveY = dy * speed * dt;

    // Test X collision
    if (!world.checkCollision(this.x + moveX, this.y, this.radius)) {
      this.x += moveX;
    }
    // Test Y collision
    if (!world.checkCollision(this.x, this.y + moveY, this.radius)) {
      this.y += moveY;
    }

    // Keep within world bounds
    const limit = CONFIG.WORLD_SIZE / 2 - 100;
    this.x = Math.max(-limit, Math.min(limit, this.x));
    this.y = Math.max(-limit, Math.min(limit, this.y));

    // Update angle towards mouse if needed or based on movement
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }
}

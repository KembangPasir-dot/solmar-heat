// SOLMAR HEAT — Player (Jax Moreno "Reef")
import { CONFIG } from './config.js';
import { Vehicle } from './vehicle.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.angle = 0;
    this.health = 100;
    this.money = 500;
    this.wanted = 0;

    this.inCar = false;
    this.currentCar = null;
  }

  update(dt, input, world, trafficManager, hud) {
    const cars = trafficManager.cars;
    const parkedCars = world.parkedCars;

    if (this.inCar && this.currentCar) {
      // Player is driving
      this.x = this.currentCar.x;
      this.y = this.currentCar.y;
      this.angle = this.currentCar.angle;

      const control = {
        forward: input.isDown('KeyW') || input.isDown('ArrowUp'),
        reverse: input.isDown('KeyS') || input.isDown('ArrowDown'),
        left: input.isDown('KeyA') || input.isDown('ArrowLeft'),
        right: input.isDown('KeyD') || input.isDown('ArrowRight'),
        handbrake: input.isDown('Space')
      };

      this.currentCar.update(dt, control, world, cars);

      if (input.consumePressed('KeyE')) {
        this.exitCar();
      }
      return;
    }

    // On foot movement
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

    if (!world.checkCollision(this.x + moveX, this.y, this.radius)) {
      this.x += moveX;
    }
    if (!world.checkCollision(this.x, this.y + moveY, this.radius)) {
      this.y += moveY;
    }

    const limit = CONFIG.WORLD_SIZE / 2 - 100;
    this.x = Math.max(-limit, Math.min(limit, this.x));
    this.y = Math.max(-limit, Math.min(limit, this.y));

    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }

    // Check enter / steal car (E)
    if (input.consumePressed('KeyE')) {
      // Check traffic cars first
      for (const car of cars) {
        const dist = Math.hypot(car.x - this.x, car.y - this.y);
        if (dist < 60) {
          this.enterCar(car, hud);
          return;
        }
      }

      // Check parked cars
      for (let i = 0; i < parkedCars.length; i++) {
        const pc = parkedCars[i];
        const dist = Math.hypot(pc.x - this.x, pc.y - this.y);
        if (dist < 60) {
          // Convert parked car into active vehicle
          const newCar = new Vehicle(pc.x, pc.y, pc.angle || 0, pc.color);
          cars.push(newCar);
          parkedCars.splice(i, 1);
          this.enterCar(newCar, hud);
          return;
        }
      }
    }
  }

  enterCar(car, hud) {
    this.inCar = true;
    this.currentCar = car;
    car.driver = 'player';
    car.stolen = true;
    this.wanted = Math.min(5, (this.wanted || 0) + 1);
    if (hud && typeof hud.showStolen === 'function') {
      hud.showStolen();
    }
  }

  exitCar() {
    if (!this.currentCar) return;
    const offsetAngle = this.currentCar.angle + Math.PI / 2;
    this.x = this.currentCar.x + Math.cos(offsetAngle) * 45;
    this.y = this.currentCar.y + Math.sin(offsetAngle) * 45;
    this.currentCar.driver = 'ai'; // becomes traffic/ai car
    this.inCar = false;
    this.currentCar = null;
  }
}

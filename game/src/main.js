// SOLMAR HEAT — Main Boot & Game Loop
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Random } from './random.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { HUD } from './hud.js';
import { SaveSystem } from './save.js';
import { setupShotStaging } from './shots.js';
import { TrafficManager } from './traffic.js';
import { PedestrianManager } from './pedestrian.js';
import { Vehicle } from './vehicle.js';
import { PoliceManager } from './police.js';
import { CombatManager } from './combat.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.input = new Input();
    this.renderer = new Renderer(this.canvas);
    this.hud = new HUD();

    this.world = null;
    this.player = null;
    this.trafficManager = null;
    this.pedestrianManager = null;
    this.policeManager = null;
    this.combatManager = null;
    this.state = 'TITLE'; // TITLE, PLAYING, PAUSED, GAMEOVER
    this.saveData = SaveSystem.load() || SaveSystem.getDefaults();

    this.lastTime = performance.now();
    this.accumulator = 0;
    this.timestep = CONFIG.TIMESTEP;

    this.initUI();
    setupShotStaging(this);

    requestAnimationFrame((t) => this.loop(t));
  }

  initUI() {
    const btnNew = document.getElementById('btn-new-game');
    const btnCont = document.getElementById('btn-continue');
    const btnResume = document.getElementById('btn-resume');
    const btnQuit = document.getElementById('btn-quit');
    const btnRetry = document.getElementById('btn-retry');
    const btnGoTitle = document.getElementById('btn-go-title');

    if (btnNew) btnNew.addEventListener('click', () => this.startNewGame());
    if (btnCont) btnCont.addEventListener('click', () => this.continueGame());
    if (btnResume) btnResume.addEventListener('click', () => this.resumeGame());
    if (btnQuit) btnQuit.addEventListener('click', () => this.goToTitle());
    if (btnRetry) btnRetry.addEventListener('click', () => this.startNewGame());
    if (btnGoTitle) btnGoTitle.addEventListener('click', () => this.goToTitle());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state === 'PLAYING') {
          this.pauseGame();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }
      if (e.code === 'Enter' && this.state === 'GAMEOVER') {
        this.goToTitle();
      }
    });
  }

  startNewGame(seed = 12345) {
    this.world = new World(seed);
    this.player = new Player(0, 0);
    this.trafficManager = new TrafficManager(this.world, seed);
    this.pedestrianManager = new PedestrianManager(this.world, seed);
    this.policeManager = new PoliceManager(this.world, seed);
    this.combatManager = new CombatManager(this.world);

    this.player.money = 500;
    this.player.health = 100;
    this.player.wanted = 0;

    this.saveData = {
      money: 500,
      health: 100,
      missionIndex: 0,
      completedMissions: [],
      x: 0,
      y: 0
    };
    SaveSystem.save(this.saveData);

    this.hideAllScreens();
    this.hud.show();
    this.state = 'PLAYING';
  }

  continueGame() {
    const saved = SaveSystem.load();
    const seed = 12345;
    this.world = new World(seed);
    this.player = new Player(saved ? saved.x || 0 : 0, saved ? saved.y || 0 : 0);
    this.trafficManager = new TrafficManager(this.world, seed);
    this.pedestrianManager = new PedestrianManager(this.world, seed);
    this.policeManager = new PoliceManager(this.world, seed);
    this.combatManager = new CombatManager(this.world);

    if (saved) {
      this.player.money = saved.money ?? 500;
      this.player.health = saved.health ?? 100;
      this.saveData = saved;
    }

    this.hideAllScreens();
    this.hud.show();
    this.state = 'PLAYING';
  }

  pauseGame() {
    this.state = 'PAUSED';
    document.getElementById('pause-screen').classList.remove('hidden');
    this.hud.hide();
  }

  resumeGame() {
    this.state = 'PLAYING';
    document.getElementById('pause-screen').classList.add('hidden');
    this.hud.show();
  }

  goToTitle() {
    this.state = 'TITLE';
    this.hideAllScreens();
    document.getElementById('title-screen').classList.remove('hidden');
    this.hud.hide();
  }

  gameOver(reason = 'BUSTED') {
    this.state = 'GAMEOVER';
    this.hud.hide();
    const screen = document.getElementById('gameover-screen');
    const title = document.getElementById('gameover-title');
    if (title) title.textContent = reason;
    screen.classList.remove('hidden');
  }

  hideAllScreens() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
  }

  stageShot(shot, seed) {
    if (shot === 'start') {
      this.world = new World(seed);
      this.player = new Player(0, 0);
      this.trafficManager = new TrafficManager(this.world, seed);
      this.pedestrianManager = new PedestrianManager(this.world, seed);
      this.policeManager = new PoliceManager(this.world, seed);
      this.combatManager = new CombatManager(this.world);

      this.state = 'TITLE';
      document.getElementById('title-screen').classList.remove('hidden');
      this.hud.hide();

      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);

      window.__shotReady = true;
    } else if (shot === 'drive') {
      this.world = new World(seed);
      this.player = new Player(0, 0);
      this.trafficManager = new TrafficManager(this.world, seed);
      this.pedestrianManager = new PedestrianManager(this.world, seed);
      this.policeManager = new PoliceManager(this.world, seed);
      this.combatManager = new CombatManager(this.world);

      // Spawn player driving a red car on a safe vertical straight road segment (380, 170) facing down (Math.PI/2)
      const car = new Vehicle(380, 170, Math.PI / 2, '#ef4444');
      car.speed = 180;
      this.trafficManager.cars.push(car);
      this.player.enterCar(car, this.hud);

      this.state = 'PLAYING';
      this.hideAllScreens();
      this.hud.show();

      // Simulate forward with throttle held for about one second (60 frames)
      const control = { forward: true, reverse: false, left: false, right: false, handbrake: false };
      for (let i = 0; i < 60; i++) {
        this.trafficManager.update(1 / 60, this.player.x, this.player.y, this.trafficManager.cars);
        this.pedestrianManager.update(1 / 60, this.player.x, this.player.y, this.trafficManager.cars);
        car.update(1 / 60, control, this.world, this.trafficManager.cars);
        this.player.x = car.x;
        this.player.y = car.y;
        this.player.angle = car.angle;
        this.renderer.updateCamera(this.player.x, this.player.y, 1 / 60);
      }

      this.hud.update(this.player, this.world, this.combatManager, this.policeManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);

      window.__shotReady = true;
    } else if (shot === 'chase') {
      this.world = new World(seed);
      this.player = new Player(0, 0);
      this.trafficManager = new TrafficManager(this.world, seed);
      this.pedestrianManager = new PedestrianManager(this.world, seed);
      this.policeManager = new PoliceManager(this.world, seed);
      this.combatManager = new CombatManager(this.world);

      this.player.wanted = 3;
      const car = new Vehicle(380, 200, Math.PI / 2, '#ef4444');
      car.speed = 320;
      this.trafficManager.cars.push(car);
      this.player.enterCar(car, this.hud);

      // Spawn police cars chasing (two behind, one ahead)
      const p1 = new Vehicle(380, 320, Math.PI / 2, '#1e3a8a');
      p1.speed = 350;
      p1.driver = 'police';
      const p2 = new Vehicle(340, 380, Math.PI / 2, '#1e3a8a');
      p2.speed = 340;
      p2.driver = 'police';
      const p3 = new Vehicle(380, 50, Math.PI / 2, '#1e3a8a');
      p3.speed = 280;
      p3.driver = 'police';
      this.policeManager.policeCars.push(p1, p2, p3);

      this.state = 'PLAYING';
      this.hideAllScreens();
      this.hud.show();

      // Simulate a few frames
      const control = { forward: true, reverse: false, left: false, right: false, handbrake: false };
      for (let i = 0; i < 40; i++) {
        this.trafficManager.update(1 / 60, this.player.x, this.player.y, this.trafficManager.cars);
        this.policeManager.update(1 / 60, this.player, this.trafficManager);
        car.update(1 / 60, control, this.world, this.trafficManager.cars.concat(this.policeManager.policeCars));
        this.player.x = car.x;
        this.player.y = car.y;
        this.player.angle = car.angle;
        this.renderer.updateCamera(this.player.x, this.player.y, 1 / 60);
      }

      this.hud.update(this.player, this.world, this.combatManager, this.policeManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);

      window.__shotReady = true;
    }
  }

  loop(currentTime) {
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt < 0.1) {
      this.accumulator += dt;
      while (this.accumulator >= this.timestep) {
        this.update(this.timestep);
        this.accumulator -= this.timestep;
      }
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      if (this.player && this.world && this.trafficManager && this.pedestrianManager) {
        // Mouse world coordinates
        this.input.mouse.worldX = this.input.mouse.x - this.canvas.width / 2 + this.renderer.camera.x;
        this.input.mouse.worldY = this.input.mouse.y - this.canvas.height / 2 + this.renderer.camera.y;

        this.trafficManager.update(dt, this.player.x, this.player.y, this.trafficManager.cars);
        this.pedestrianManager.update(dt, this.player.x, this.player.y, this.trafficManager.cars);

        if (this.policeManager) {
          const bustResult = this.policeManager.update(dt, this.player, this.trafficManager);
          if (bustResult === 'BUSTED') {
            this.gameOver('BUSTED');
            return;
          }
        }

        if (this.combatManager) {
          this.combatManager.update(dt, this.input, this.player, this.trafficManager, this.pedestrianManager, this.policeManager);
        }

        this.player.update(dt, this.input, this.world, this.trafficManager, this.hud);

        // Check health damage / wrecked car
        if (this.player.inCar && this.player.currentCar) {
          if (this.player.currentCar.wrecked) {
            this.player.health = 0;
          }
        }

        if (this.player.health <= 0) {
          this.gameOver('WASTED');
          return;
        }

        this.renderer.updateCamera(this.player.x, this.player.y, dt);
        this.hud.update(this.player, this.world, this.combatManager, this.policeManager);
      }
    }
  }

  render() {
    if (!this.world || !this.player || !this.trafficManager || !this.pedestrianManager) {
      if (!this.world) {
        this.world = new World(12345);
        this.player = new Player(0, 0);
        this.trafficManager = new TrafficManager(this.world, 12345);
        this.pedestrianManager = new PedestrianManager(this.world, 12345);
        this.policeManager = new PoliceManager(this.world, 12345);
        this.combatManager = new CombatManager(this.world);
      }
    }
    this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});

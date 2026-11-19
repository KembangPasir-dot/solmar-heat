// SOLMAR HEAT — Main Boot & Game Loop with Audio & Effects Integration
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
import { MissionManager } from './missions.js';
import { AudioManager } from './audio.js';
import { EffectsManager } from './effects.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.input = new Input();
    this.renderer = new Renderer(this.canvas);
    this.hud = new HUD();
    this.missionManager = new MissionManager();
    this.audioManager = new AudioManager();
    this.effectsManager = new EffectsManager();

    this.world = null;
    this.player = null;
    this.trafficManager = null;
    this.pedestrianManager = null;
    this.policeManager = null;
    this.combatManager = null;
    this.state = 'TITLE'; // TITLE, PLAYING, PAUSED, GAMEOVER
    this.saveData = SaveSystem.load() || SaveSystem.getDefaults();

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

    const clickSound = () => { if (this.audioManager) this.audioManager.playClick(); };

    if (btnNew) btnNew.addEventListener('click', () => { clickSound(); this.startNewGame(); });
    if (btnCont) btnCont.addEventListener('click', () => { clickSound(); this.continueGame(); });
    if (btnResume) btnResume.addEventListener('click', () => { clickSound(); this.resumeGame(); });
    if (btnQuit) btnQuit.addEventListener('click', () => { clickSound(); this.goToTitle(); });
    if (btnRetry) btnRetry.addEventListener('click', () => { clickSound(); this.startNewGame(); });
    if (btnGoTitle) btnGoTitle.addEventListener('click', () => { clickSound(); this.goToTitle(); });

    const pauseScreenContent = document.querySelector('#pause-screen .screen-content');
    if (pauseScreenContent && !document.getElementById('btn-save-game')) {
      const saveBtn = document.createElement('button');
      saveBtn.id = 'btn-save-game';
      saveBtn.className = 'btn';
      saveBtn.textContent = 'SAVE PROGRESS';
      saveBtn.style.marginTop = '10px';
      saveBtn.addEventListener('click', () => {
        clickSound();
        this.saveProgress();
        saveBtn.textContent = 'PROGRESS SAVED!';
        setTimeout(() => { saveBtn.textContent = 'SAVE PROGRESS'; }, 2000);
      });
      pauseScreenContent.querySelector('.menu-options').appendChild(saveBtn);
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        clickSound();
        if (this.state === 'PLAYING') {
          this.pauseGame();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }
      if (e.code === 'Enter') {
        clickSound();
        if (this.state === 'GAMEOVER') {
          this.goToTitle();
        } else if (this.missionManager.state === 'BRIEFING') {
          this.missionManager.beginActiveMission();
        } else if (this.missionManager.state === 'COMPLETE') {
          this.audioManager.playMissionComplete();
          this.missionManager.advanceToNext();
          this.saveProgress();
        } else if (this.missionManager.state === 'ALL_COMPLETE') {
          document.getElementById('ending-screen-modal')?.classList.add('hidden');
          this.state = 'PLAYING';
        }
      }
      if (e.code === 'KeyR') {
        if (this.missionManager.state === 'FAILED') {
          clickSound();
          this.retryCurrentMission();
        } else {
          clickSound();
          if (this.audioManager) {
            this.audioManager.cycleStation();
          }
        }
      }
    });
  }

  saveProgress() {
    const respectCount = Math.min(7, Math.max(0, this.missionManager ? this.missionManager.currentIndex : 0));
    this.saveData = {
      money: this.player ? this.player.money : 500,
      health: this.player ? this.player.health : 100,
      missionIndex: this.missionManager.currentIndex,
      completedMissions: this.saveData.completedMissions || [],
      respect: respectCount,
      x: this.player ? this.player.x : 0,
      y: this.player ? this.player.y : 0
    };
    SaveSystem.save(this.saveData);
  }

  startNewGame(seed = 12345) {
    this.world = new World(seed);
    this.player = new Player(0, 0);
    this.trafficManager = new TrafficManager(this.world, seed);
    this.pedestrianManager = new PedestrianManager(this.world, seed);
    this.policeManager = new PoliceManager(this.world, seed);
    this.combatManager = new CombatManager(this.world);
    this.missionManager = new MissionManager();

    this.player.money = 500;
    this.player.health = 100;
    this.player.wanted = 0;

    this.saveProgress();
    this.hideAllScreens();
    this.hud.show();
    this.state = 'PLAYING';

    this.missionManager.startBriefing(0);
  }

  continueGame() {
    const saved = SaveSystem.load() || SaveSystem.getDefaults();
    const seed = 12345;
    this.world = new World(seed);
    this.player = new Player(saved.x || 0, saved.y || 0);
    this.trafficManager = new TrafficManager(this.world, seed);
    this.pedestrianManager = new PedestrianManager(this.world, seed);
    this.policeManager = new PoliceManager(this.world, seed);
    this.combatManager = new CombatManager(this.world);
    this.missionManager = new MissionManager();

    this.player.money = saved.money ?? 500;
    this.player.health = saved.health ?? 100;
    this.missionManager.currentIndex = saved.missionIndex ?? 0;
    this.saveData = saved;

    this.hideAllScreens();
    this.hud.show();
    this.state = 'PLAYING';
  }

  retryCurrentMission() {
    if (this.player) {
      this.player.health = 100;
      this.player.wanted = 0;
      if (this.player.inCar && this.player.currentCar) {
        this.player.exitCar();
      }
    }
    this.missionManager.hideAllModals();
    this.missionManager.beginActiveMission();
    this.state = 'PLAYING';
    this.hud.show();
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
    this.missionManager.hideAllModals();
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

      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager, this.effectsManager);

      window.__shotReady = true;
    } else if (shot === 'drive') {
      this.world = new World(seed);
      this.player = new Player(0, 0);
      this.trafficManager = new TrafficManager(this.world, seed);
      this.pedestrianManager = new PedestrianManager(this.world, seed);
      this.policeManager = new PoliceManager(this.world, seed);
      this.combatManager = new CombatManager(this.world);

      const car = new Vehicle(380, 170, Math.PI / 2, '#ef4444');
      car.speed = 180;
      this.trafficManager.cars.push(car);
      this.player.enterCar(car, this.hud);

      this.state = 'PLAYING';
      this.hideAllScreens();
      this.hud.show();

      const control = { forward: true, reverse: false, left: false, right: false, handbrake: false };
      for (let i = 0; i < 60; i++) {
        this.trafficManager.update(1 / 60, this.player.x, this.player.y, this.trafficManager.cars);
        this.pedestrianManager.update(1 / 60, this.player.x, this.player.y, this.trafficManager.cars);
        car.update(1 / 60, control, this.world, this.trafficManager.cars);
        this.player.x = car.x;
        this.player.y = car.y;
        this.player.angle = car.angle;
        this.renderer.updateCamera(this.player.x, this.player.y, 1 / 60, this.effectsManager);
      }

      this.hud.update(this.player, this.world, this.combatManager, this.policeManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager, this.effectsManager);

      window.__shotReady = true;
    } else if (shot === 'chase') {
      this.world = new World(seed);
      this.player = new Player(0, 0);
      this.trafficManager = new TrafficManager(this.world, seed);
      this.pedestrianManager = new PedestrianManager(this.world, seed);
      this.policeManager = new PoliceManager(this.world, seed);
      this.combatManager = new CombatManager(this.world);

      this.player.wanted = 3;
      const car = new Vehicle(380, 150, Math.PI / 2, '#ef4444');
      car.speed = 340;
      this.trafficManager.cars.push(car);
      this.player.enterCar(car, this.hud);

      const p1 = new Vehicle(380, 270, Math.PI / 2, '#1e3a8a');
      p1.speed = 360;
      p1.driver = 'police';
      const p2 = new Vehicle(380, 350, Math.PI / 2, '#1e3a8a');
      p2.speed = 350;
      p2.driver = 'police';
      this.policeManager.policeCars.push(p1, p2);

      this.state = 'PLAYING';
      this.hideAllScreens();
      this.hud.show();

      const control = { forward: true, reverse: false, left: false, right: false, handbrake: false };
      for (let i = 0; i < 50; i++) {
        this.trafficManager.update(1 / 60, this.player.x, this.player.y, this.trafficManager.cars);
        this.policeManager.update(1 / 60, this.player, this.trafficManager);
        car.update(1 / 60, control, this.world, this.trafficManager.cars.concat(this.policeManager.policeCars));
        this.player.x = car.x;
        this.player.y = car.y;
        this.player.angle = car.angle;
        this.renderer.updateCamera(this.player.x, this.player.y, 1 / 60, this.effectsManager);
      }

      this.hud.update(this.player, this.world, this.combatManager, this.policeManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager, this.effectsManager);

      window.__shotReady = true;
    } else if (shot === 'mission') {
      this.world = new World(seed);
      this.player = new Player(100, 100);
      this.trafficManager = new TrafficManager(this.world, seed);
      this.pedestrianManager = new PedestrianManager(this.world, seed);
      this.policeManager = new PoliceManager(this.world, seed);
      this.combatManager = new CombatManager(this.world);

      this.missionManager.startBriefing(0);
      this.missionManager.beginActiveMission();

      this.state = 'PLAYING';
      this.hideAllScreens();
      this.hud.show();

      this.hud.update(this.player, this.world, this.combatManager, this.policeManager);
      this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager, this.effectsManager);

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
          const oldAmmo = this.combatManager.ammo;
          this.combatManager.update(dt, this.input, this.player, this.trafficManager, this.pedestrianManager, this.policeManager);
          if (this.combatManager.ammo < oldAmmo) {
            this.audioManager.playGunshot();
            this.effectsManager.addSpark(this.player.x + Math.cos(this.player.angle)*20, this.player.y + Math.sin(this.player.angle)*20, '#fef08a', 5);
          }
        }

        this.player.update(dt, this.input, this.world, this.trafficManager, this.hud);

        // Update audio & effects
        this.audioManager.updateEngineAndSiren(this.player, this.policeManager, dt);
        this.effectsManager.update(dt);

        if (this.missionManager) {
          const prevMissionState = this.missionManager.state;
          this.missionManager.update(dt, this.player, this.combatManager, this.policeManager, this.world);
          if (this.missionManager.state === 'COMPLETE' && prevMissionState !== 'COMPLETE') {
            this.audioManager.playMissionComplete();
            const m = this.missionManager.getCurrentMission();
            if (m && !this._missionPaid) {
              this.player.money += m.payout;
              this._missionPaid = true;
              this.saveProgress();
            }
          } else if (this.missionManager.state !== 'COMPLETE') {
            this.missionManager.advanceToNext; // keep state clean
            this._missionPaid = false;
          }
        }

        if (this.player.inCar && this.player.currentCar) {
          if (this.player.currentCar.wrecked) {
            this.player.health = 0;
            this.audioManager.playCrash(true);
            this.effectsManager.triggerScreenShake(12, 0.4);
            this.effectsManager.addSpark(this.player.x, this.player.y, '#f97316', 30);
          }
        }

        if (this.player.health <= 0) {
          this.gameOver('WASTED');
          return;
        }

        this.renderer.updateCamera(this.player.x, this.player.y, dt, this.effectsManager);
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
    this.renderer.render(this.world, this.player, this.input, this.trafficManager, this.pedestrianManager, this.policeManager, this.combatManager, this.effectsManager);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});

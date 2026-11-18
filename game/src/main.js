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

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.input = new Input();
    this.renderer = new Renderer(this.canvas);
    this.hud = new HUD();

    this.world = null;
    this.player = null;
    this.state = 'TITLE'; // TITLE, PLAYING, PAUSED, GAMEOVER
    this.saveData = SaveSystem.load() || SaveSystem.getDefaults();

    this.lastTime = performance.now();
    this.accumulator = 0;
    this.timestep = CONFIG.TIMESTEP;

    this.initUI();
    setupShotStaging(this);

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initUI() {
    const btnNew = document.getElementById('btn-new-game');
    const btnCont = document.getElementById('btn-continue');
    const btnResume = document.getElementById('btn-resume');
    const btnQuit = document.getElementById('btn-quit');
    const btnRetry = document.getElementById('btn-retry');
    const btnGoTitle = document.getElementById('btn-go-title');

    if (btnNew) {
      btnNew.addEventListener('click', () => this.startNewGame());
    }
    if (btnCont) {
      btnCont.addEventListener('click', () => this.continueGame());
    }
    if (btnResume) {
      btnResume.addEventListener('click', () => this.resumeGame());
    }
    if (btnQuit) {
      btnQuit.addEventListener('click', () => this.goToTitle());
    }
    if (btnRetry) {
      btnRetry.addEventListener('click', () => this.startNewGame());
    }
    if (btnGoTitle) {
      btnGoTitle.addEventListener('click', () => this.goToTitle());
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state === 'PLAYING') {
          this.pauseGame();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }
    });
  }

  startNewGame(seed = 12345) {
    this.world = new World(seed);
    this.player = new Player(0, 0);
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
      // Deterministic setup for title/cover shot
      this.world = new World(seed);
      this.player = new Player(0, 0);
      this.state = 'TITLE';
      document.getElementById('title-screen').classList.remove('hidden');
      this.hud.hide();

      // Render twice to ensure canvas is fully painted
      this.renderer.render(this.world, this.player, this.input);
      this.renderer.render(this.world, this.player, this.input);

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
      if (this.player && this.world) {
        this.player.update(dt, this.input, this.world);
        this.renderer.updateCamera(this.player.x, this.player.y, dt);
        this.hud.update(this.player, this.world);
      }
    }
  }

  render() {
    if (!this.world || !this.player) {
      // Fallback world/player for rendering title scene background
      if (!this.world) {
        this.world = new World(12345);
        this.player = new Player(0, 0);
      }
    }
    this.renderer.render(this.world, this.player, this.input);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});

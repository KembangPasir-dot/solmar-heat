// SOLMAR HEAT — Mission System & Logic
import { STORY_DATA } from './story.js';

export class MissionManager {
  constructor() {
    this.missions = STORY_DATA.missions;
    this.currentIndex = 0;
    this.state = 'IDLE'; // IDLE, BRIEFING, ACTIVE, COMPLETE, FAILED, ALL_COMPLETE
    this.timer = 0;
    this.elapsedTime = 0;
    this.subState = 0; // for multi-step missions
  }

  getCurrentMission() {
    if (this.currentIndex >= this.missions.length) return null;
    return this.missions[this.currentIndex];
  }

  startBriefing(index = this.currentIndex) {
    if (index >= this.missions.length) {
      this.state = 'ALL_COMPLETE';
      this.showEndingScreen();
      return;
    }
    this.currentIndex = index;
    this.state = 'BRIEFING';
    const mission = this.getCurrentMission();
    if (mission) {
      this.showBriefingModal(mission);
    }
  }

  beginActiveMission() {
    this.state = 'ACTIVE';
    const mission = this.getCurrentMission();
    if (mission && mission.timeLimit) {
      this.timer = mission.timeLimit;
    } else {
      this.timer = 0;
    }
    this.elapsedTime = 0;
    this.subState = 0;
    this.hideAllModals();
  }

  update(dt, player, combatManager, policeManager, world) {
    if (this.state !== 'ACTIVE') return;

    const mission = this.getCurrentMission();
    if (!mission) return;

    if (mission.timeLimit) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.failMission('Time ran out!');
        return;
      }
    }

    this.elapsedTime += dt;
    const target = mission.targetLocation;
    const dist = Math.hypot(player.x - target.x, player.y - target.y);

    switch (this.currentIndex) {
      case 0: // Mission 1: Steal a car and reach Marisol's garage
        if (dist < 60) {
          this.completeMission();
        }
        break;

      case 1: // Mission 2: Marina Delivery
        if (dist < 60) {
          this.completeMission();
        }
        break;

      case 2: // Mission 3: Cooling Down (lose 2-star wanted, reach safehouse)
        if (this.subState === 0) {
          if (player.wanted === 0) {
            this.subState = 1; // Wanted cleared, now go to safehouse
          }
        } else {
          if (dist < 60) {
            this.completeMission();
          }
        }
        break;

      case 3: // Mission 4: Kings in the Alley (eliminate enemies at alley)
        if (dist < 80) {
          // If combat manager has no active enemies or after defeating them
          this.subState = 1;
        }
        if (this.subState === 1 && this.elapsedTime > 5) {
          this.completeMission();
        }
        break;

      case 4: // Mission 5: Downtown Ledger (grab ledger, escape with 3-star wanted to safehouse)
        if (this.subState === 0 && dist < 60) {
          this.subState = 1; // Ledger grabbed, wanted level set to 3
          player.wanted = 3;
        } else if (this.subState === 1 && player.wanted === 0) {
          this.subState = 2; // Heat lost, return to safehouse {100, -200}
        } else if (this.subState === 2) {
          const safehouseDist = Math.hypot(player.x - 100, player.y - (-200));
          if (safehouseDist < 60) {
            this.completeMission();
          }
        }
        break;

      case 5: // Mission 6: Dawn at Solmar Bay (finale)
        if (dist < 60) {
          this.completeMission();
        }
        break;
    }
  }

  getCurrentObjectiveText() {
    const mission = this.getCurrentMission();
    if (!mission) return 'All missions complete! Free roam Solmar Bay.';

    switch (this.currentIndex) {
      case 2:
        return this.subState === 0 ? 'Lose your wanted level (0 stars).' : 'Drive to the Old Town safehouse.';
      case 4:
        if (this.subState === 0) return 'Reach the Downtown tower to grab the ledger.';
        if (this.subState === 1) return 'Lose your 3-star wanted level!';
        return 'Return to the Old Town safehouse.';
      default:
        return mission.objectiveText;
    }
  }

  getCurrentWaypoint() {
    const mission = this.getCurrentMission();
    if (!mission) return null;
    if (this.currentIndex === 2 && this.subState === 1) {
      return { x: 100, y: -200, label: 'Safehouse' };
    }
    if (this.currentIndex === 4 && this.subState === 2) {
      return { x: 100, y: -200, label: 'Safehouse' };
    }
    return { x: mission.targetLocation.x, y: mission.targetLocation.y, label: mission.title };
  }

  completeMission() {
    this.state = 'COMPLETE';
    const mission = this.getCurrentMission();
    if (mission) {
      this.showCompleteModal(mission);
    }
  }

  failMission(reason) {
    this.state = 'FAILED';
    this.showFailedModal(reason);
  }

  showBriefingModal(mission) {
    let modal = document.getElementById('mission-briefing-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-briefing-modal';
      modal.className = 'screen';
      modal.innerHTML = `
        <div class="screen-content">
          <h2 id="briefing-title" class="screen-heading">MISSION BRIEFING</h2>
          <p id="briefing-text" style="color:#cbd5e1; margin-bottom:25px; line-height:1.6; font-size:1.05rem;"></p>
          <div class="menu-options">
            <button id="btn-start-mission" class="btn primary">START MISSION (ENTER)</button>
          </div>
        </div>
      `;
      document.getElementById('game-container').appendChild(modal);
      document.getElementById('btn-start-mission').addEventListener('click', () => {
        this.beginActiveMission();
      });
    }
    document.getElementById('briefing-title').textContent = mission.briefingTitle;
    document.getElementById('briefing-text').textContent = mission.briefingText;
    modal.classList.remove('hidden');
  }

  showCompleteModal(mission) {
    let modal = document.getElementById('mission-complete-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-complete-modal';
      modal.className = 'screen';
      modal.innerHTML = `
        <div class="screen-content">
          <h2 class="screen-heading" style="color:#22c55e;">MISSION COMPLETE</h2>
          <p id="complete-desc" style="color:#cbd5e1; margin-bottom:20px; font-size:1.1rem;"></p>
          <p id="complete-payout" style="color:#fbbf24; font-size:1.4rem; font-weight:bold; margin-bottom:30px;"></p>
          <div class="menu-options">
            <button id="btn-next-mission" class="btn primary">CONTINUE (ENTER)</button>
          </div>
        </div>
      `;
      document.getElementById('game-container').appendChild(modal);
      document.getElementById('btn-next-mission').addEventListener('click', () => {
        this.advanceToNext();
      });
    }
    document.getElementById('complete-desc').textContent = `Completed: ${mission.title}`;
    document.getElementById('complete-payout').textContent = `Payout: +$${mission.payout}`;
    modal.classList.remove('hidden');
  }

  showFailedModal(reason) {
    let modal = document.getElementById('mission-failed-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-failed-modal';
      modal.className = 'screen';
      modal.innerHTML = `
        <div class="screen-content">
          <h2 class="screen-heading red">MISSION FAILED</h2>
          <p id="fail-reason" style="color:#9ca3af; margin-bottom:25px; font-size:1.1rem;"></p>
          <div class="menu-options">
            <button id="btn-retry-mission" class="btn primary">RETRY MISSION (R)</button>
          </div>
        </div>
      `;
      document.getElementById('game-container').appendChild(modal);
      document.getElementById('btn-retry-mission').addEventListener('click', () => {
        window.game.retryCurrentMission();
      });
    }
    document.getElementById('fail-reason').textContent = reason || 'Objective failed.';
    modal.classList.remove('hidden');
  }

  showEndingScreen() {
    let modal = document.getElementById('ending-screen-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ending-screen-modal';
      modal.className = 'screen';
      modal.innerHTML = `
        <div class="screen-content">
          <h2 class="screen-heading">KING OF SOLMAR</h2>
          <p style="color:#cbd5e1; margin-bottom:20px; font-size:1.1rem; line-height:1.6;">You conquered Solmar Bay, defeated the Coral Kings, and secured your legacy as the ultimate getaway driver. Free roam is now unlocked!</p>
          <div class="menu-options">
            <button id="btn-free-roam" class="btn primary">FREE ROAM (ENTER)</button>
          </div>
        </div>
      `;
      document.getElementById('game-container').appendChild(modal);
      document.getElementById('btn-free-roam').addEventListener('click', () => {
        modal.classList.add('hidden');
        window.game.state = 'PLAYING';
      });
    }
    modal.classList.remove('hidden');
  }

  advanceToNext() {
    this.hideAllModals();
    this.currentIndex++;
    if (this.currentIndex >= this.missions.length) {
      this.state = 'ALL_COMPLETE';
      this.showEndingScreen();
    } else {
      this.startBriefing(this.currentIndex);
    }
  }

  hideAllModals() {
    const ids = ['mission-briefing-modal', 'mission-complete-modal', 'mission-failed-modal', 'ending-screen-modal'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }
  }
}

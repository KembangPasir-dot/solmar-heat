// SOLMAR HEAT — Save & Load System
export const SaveSystem = {
  KEY: 'solmar_heat_save_v1',

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save game state:', e);
    }
  },

  load() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.respect === undefined) {
          parsed.respect = parsed.completedMissions ? parsed.completedMissions.length : (parsed.missionIndex || 0);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load game state:', e);
    }
    return null;
  },

  getDefaults() {
    return {
      money: 500,
      health: 100,
      missionIndex: 0,
      completedMissions: [],
      respect: 0,
      x: 0,
      y: 0
    };
  }
};

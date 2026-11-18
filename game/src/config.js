// SOLMAR HEAT — Tuning Constants
export const CONFIG = {
  WORLD_SIZE: 4000,
  ROAD_WIDTH: 80,
  SIDEWALK_WIDTH: 20,
  BLOCK_SIZE: 260,
  PLAYER_SPEED: 180,
  PLAYER_RUN_SPEED: 320,
  PLAYER_RADIUS: 16,
  CAMERA_LERP: 0.1,
  TIMESTEP: 1 / 60,
  DISTRICTS: [
    { name: 'Marina', color: '#0ea5e9', roadColor: '#1e293b', sidewalkColor: '#334155' },
    { name: 'Downtown', color: '#f59e0b', roadColor: '#0f172a', sidewalkColor: '#1e293b' },
    { name: 'Old Town', color: '#dc2626', roadColor: '#18181b', sidewalkColor: '#27272a' },
    { name: 'Beachfront', color: '#10b981', roadColor: '#1e293b', sidewalkColor: '#334155' },
    { name: 'Hills', color: '#8b5cf6', roadColor: '#1e1b4b', sidewalkColor: '#312e81' },
    { name: 'Industrial', color: '#64748b', roadColor: '#090d16', sidewalkColor: '#1e293b' }
  ]
};

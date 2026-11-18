// SOLMAR HEAT — Shot Staging Helper for Screenshots
export function setupShotStaging(gameInstance) {
  const urlParams = new URLSearchParams(window.location.search);
  const shot = urlParams.get('shot');
  const seedParam = urlParams.get('seed');
  const seed = seedParam ? parseInt(seedParam, 10) : 12345;

  if (shot) {
    console.log(`[Shot Staging] Active shot: ${shot}, seed: ${seed}`);
    if (gameInstance && typeof gameInstance.stageShot === 'function') {
      gameInstance.stageShot(shot, seed);
    }
  }

  return { shot, seed };
}

// SOLMAR HEAT — City Generation (Solmar Bay)
import { CONFIG } from './config.js';
import { Random } from './random.js';

export class World {
  constructor(seed = 12345) {
    this.random = new Random(seed);
    this.buildings = [];
    this.parkedCars = [];
    this.palms = [];
    this.lamps = [];
    this.roadSegments = [];
    this.generateCity();
  }

  generateCity() {
    const size = CONFIG.WORLD_SIZE;
    const blockSize = CONFIG.BLOCK_SIZE;
    const roadWidth = CONFIG.ROAD_WIDTH;
    const step = blockSize + roadWidth;

    // Generate grid blocks and buildings
    for (let x = -size / 2; x < size / 2; x += step) {
      for (let y = -size / 2; y < size / 2; y += step) {
        // Determine district based on position
        const distFromCenter = Math.sqrt(x * x + y * y);
        let districtIdx = 0;
        if (distFromCenter < 600) districtIdx = 1; // Downtown
        else if (x < -600 && y < -600) districtIdx = 2; // Old Town
        else if (x > 600 && y > 600) districtIdx = 0; // Marina
        else if (y < -600 && x > 600) districtIdx = 3; // Beachfront
        else if (x < -600 && y > 600) districtIdx = 4; // Hills
        else districtIdx = 5; // Industrial

        const district = CONFIG.DISTRICTS[districtIdx];

        // Building box
        const bx = x + roadWidth / 2;
        const by = y + roadWidth / 2;
        const bw = blockSize;
        const bh = blockSize;

        const bHeight = this.random.range(30, districtIdx === 1 ? 180 : 90);
        const bColor = this.random.choice(
          districtIdx === 1 
            ? ['#1e293b', '#334155', '#475569', '#0f172a'] 
            : ['#292524', '#44403c', '#1c1917', '#57534e']
        );

        this.buildings.push({
          x: bx,
          y: by,
          w: bw,
          h: bh,
          height: bHeight,
          color: bColor,
          district: district.name
        });

        // Add parked cars along road edges
        if (this.random.next() > 0.4) {
          this.parkedCars.push({
            x: bx + bw / 2,
            y: by - 10,
            w: 24,
            h: 46,
            angle: 0,
            color: this.random.choice(['#ef4444', '#3b82f6', '#10b981', '#eab308', '#a855f7'])
          });
        }

        // Add palm trees / street lamps
        if (this.random.next() > 0.5) {
          this.palms.push({
            x: bx - 10,
            y: by - 10
          });
        }
        if (this.random.next() > 0.6) {
          this.lamps.push({
            x: bx + bw + 10,
            y: by + bh + 10
          });
        }
      }
    }
  }

  checkCollision(boxX, boxY, radius) {
    for (const b of this.buildings) {
      // Circle vs AABB collision
      const closestX = Math.max(b.x, Math.min(boxX, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(boxY, b.y + b.h));
      const distX = boxX - closestX;
      const distY = boxY - closestY;
      const distSq = distX * distX + distY * distY;
      if (distSq < radius * radius) {
        return true;
      }
    }
    return false;
  }
}
